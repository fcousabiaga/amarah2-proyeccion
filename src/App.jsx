import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";

// ─── PALETA ───────────────────────────────────────────────────────────────────
const G = {
  bg:"#0A0E1A", surface:"#111827", surfaceLight:"#1C2333", border:"#1E2D45",
  accent:"#00C6A2", accentDim:"#00C6A220", gold:"#F5C842", goldDim:"#F5C84220",
  red:"#FF4D6D", redDim:"#FF4D6D20", blue:"#3B82F6", blueDim:"#3B82F620",
  purple:"#A855F7", purpleDim:"#A855F720", orange:"#FB923C",
  text:"#E8EDF5", textMuted:"#6B7A99", textDim:"#8896B3",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${G.bg};color:${G.text};font-family:'Syne',sans-serif;font-size:13px}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:${G.bg}}
  ::-webkit-scrollbar-thumb{background:${G.border};border-radius:3px}
  select{background:${G.bg};color:${G.text};border:1px solid ${G.border};border-radius:6px;
    padding:6px 10px;font-family:'IBM Plex Mono',monospace;font-size:12px;width:100%;outline:none}
  select:focus{border-color:${G.accent}}
  input[type=range]{accent-color:${G.accent};cursor:pointer;width:100%}
  button{cursor:pointer;font-family:'Syne',sans-serif;transition:all .15s}
  .mono{font-family:'IBM Plex Mono',monospace}
  .tab-on{border-bottom:2px solid ${G.accent}!important;color:${G.accent}!important}
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt    = (n,d=0) => isNaN(n)||!isFinite(n)?"—":n.toLocaleString("es-MX",{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtM   = (n) => `$${fmt(n,0)}`;
const fmtMM  = (n) => { const a=Math.abs(n); if(a>=1e6) return `$${fmt(n/1e6,2)}M`; if(a>=1e3) return `$${fmt(n/1e3,1)}K`; return fmtM(n); };
const pct    = (n) => `${fmt(n,1)}%`;
const clamp  = (v,mn,mx) => Math.min(mx,Math.max(mn,v));
const unparse= (s) => parseFloat(String(s).replace(/,/g,""))||0;

// ─── INPUT CON FORMATO DE MILES ───────────────────────────────────────────────
function MoneyInput({value, onChange, prefix="$", style={}}){
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const startEdit = () => { setEditing(true); setRaw(String(Math.round(value))); };
  const finishEdit = () => {
    setEditing(false);
    const v = parseFloat(raw.replace(/,/g,""));
    if(!isNaN(v)) onChange(v);
  };
  const display = editing ? raw : fmt(Math.round(value));
  return (
    <div style={{position:"relative",display:"flex",alignItems:"center",...style}}>
      {prefix && <span className="mono" style={{position:"absolute",left:9,color:G.accent,fontSize:11,pointerEvents:"none",zIndex:1}}>{prefix}</span>}
      <input
        className="mono"
        value={display}
        onFocus={startEdit}
        onBlur={finishEdit}
        onChange={e=>setRaw(e.target.value)}
        style={{paddingLeft:prefix?20:9,background:G.bg,color:G.text,border:`1px solid ${G.border}`,
          borderRadius:6,padding:"5px 9px",paddingLeft:prefix?22:9,fontSize:12,width:"100%",
          outline:"none",fontFamily:"'IBM Plex Mono',monospace"}}
      />
    </div>
  );
}

function PctInput({value, onChange, style={}}){
  return (
    <div style={{position:"relative",...style}}>
      <input type="number" value={value} min={0} max={100} step={0.1}
        onChange={e=>onChange(parseFloat(e.target.value)||0)}
        className="mono"
        style={{background:G.bg,color:G.text,border:`1px solid ${G.border}`,borderRadius:6,
          padding:"5px 26px 5px 9px",fontSize:12,width:"100%",outline:"none"}}/>
      <span className="mono" style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",
        color:G.textMuted,fontSize:11,pointerEvents:"none"}}>%</span>
    </div>
  );
}

function SmallNum({value,onChange,min=0,max=9999,step=1}){
  return (
    <input type="number" value={value} min={min} max={max} step={step}
      onChange={e=>onChange(parseFloat(e.target.value)||0)}
      className="mono"
      style={{background:G.bg,color:G.text,border:`1px solid ${G.border}`,borderRadius:6,
        padding:"5px 9px",fontSize:12,width:"100%",outline:"none"}}/>
  );
}

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────
const PARTIDAS_DEF = [
  {id:"terreno",        label:"Valor del Terreno",  total:6500000,  color:"#06B6D4", manual:false},
  {id:"urbanizacion",   label:"Urbanización",        total:45000000, color:G.blue,   manual:false},
  {id:"adminNomina",    label:"Nómina",               total:8000000,  color:G.purple, manual:false},
  {id:"adminOficinas",  label:"Oficinas",             total:1500000,  color:G.purple, manual:false},
  {id:"adminServicios", label:"Servicios Prof.",      total:2000000,  color:G.purple, manual:false},
  {id:"adminPlataformas",label:"Plataformas",         total:500000,   color:G.purple, manual:false},
  {id:"pubRedes",       label:"Redes Sociales",       total:1200000,  color:"#FBBF24",manual:false},
  {id:"pubEventos",     label:"Eventos y Activaciones",total:1000000, color:"#F59E0B",manual:false},
  {id:"pubBonos",       label:"Bonos y Premios Venta",total:800000,   color:"#D97706",manual:false},
  {id:"legalTramites",  label:"Tramitología",         total:1200000,  color:G.accent, manual:false},
  {id:"legalFideicomiso",label:"Fideicomiso",         total:800000,   color:G.accent, manual:false},
  {id:"gestiones",      label:"Gestiones",            total:1000000,  color:G.textDim,manual:false},
];

const genBloques = (n, total) =>
  Array.from({length:n},()=>({ pct: parseFloat((100/n).toFixed(1)) }));

const buildPartidas = (nB) => PARTIDAS_DEF.map(p=>({...p, bloques:genBloques(nB,p.total)}));

const DEF = {
  hectareas:40, pctVendible:51,
  lotes:[
    {m2:180,pct:20},{m2:200,pct:30},{m2:220,pct:20},
    {m2:240,pct:15},{m2:300,pct:10},{m2:360,pct:5},
  ],
  numClusters:8,
  clusters:Array.from({length:8},(_,i)=>({incrementoPct:i===0?0:5,precioFijo:null,activoPrecioFijo:false})),
  precioBaseM2:1200, plazoBase:96,
  numLotesComerciales:45, m2Comercial:200,
  precioBaseM2Comercial:2900, nivelesComerciales:5, incrementoComercialPct:5,
  plazoComercial:36,
  pctInicioComerciales:50,
  plazos:[
    {meses:0,  label:"Contado",pct:5, delta:-20},
    {meses:12, label:"12m",    pct:5, delta:-15},
    {meses:24, label:"24m",    pct:10,delta:-12},
    {meses:36, label:"36m",    pct:15,delta:-8 },
    {meses:48, label:"48m",    pct:15,delta:-5 },
    {meses:60, label:"60m",    pct:15,delta:-3 },
    {meses:72, label:"72m",    pct:15,delta:0  },
    {meses:84, label:"84m",    pct:10,delta:0  },
    {meses:96, label:"96m",    pct:10,delta:0  },
  ],
  pctEnganche:15,
  pctVentasEngancheContado:30, pctVentasEnganche2pagos:40, pctVentasEnganche3pagos:30,
  opcionMensualidad:"junto_segundo",
  pctComision:5,
  retencionMensual:15000, pctCostoFinanciero:0.5,
  reservaMinima:3,
  utilBaseMultiplier:0.015,
  utilGrowthRate:1.15,
  // Efectividad de cobro y cancelaciones
  efectividadCobro:85,        // % de mensualidades que efectivamente se cobran
  mesCancelacionInicio:6,     // mes a partir del cual empiezan cancelaciones
  cancelacionesPorMes:2,      // lotes cancelados por mes (vuelven al inventario)
  partidas: buildPartidas(8),
};

// ─── ENGINE ───────────────────────────────────────────────────────────────────
function calcEngine(p, ventasMes) {
  const totalLotePct = p.lotes.reduce((a,l)=>a+l.pct,0)||1;
  const m2PorLote    = p.lotes.reduce((a,l)=>a+l.m2*(l.pct/totalLotePct),0);
  const m2Vendible   = p.hectareas*10000*(p.pctVendible/100);
  const totalResid   = Math.floor(m2Vendible/m2PorLote);
  const totalLotes   = totalResid + p.numLotesComerciales;
  const mesInicioComerciales = Math.ceil(totalResid*(p.pctInicioComerciales/100)/ventasMes);

  // Clusters
  let precioCluster=[]; let acum=1;
  for(let i=0;i<p.numClusters;i++){
    const c=p.clusters[i];
    if(c.activoPrecioFijo&&c.precioFijo){ precioCluster.push(c.precioFijo); acum=c.precioFijo/p.precioBaseM2; }
    else{ acum*=1+(c.incrementoPct||0)/100; precioCluster.push(p.precioBaseM2*acum); }
  }

  // Plazos: delta positivo = incremento, negativo = descuento
  const totalPctPlazos = p.plazos.reduce((a,pl)=>a+pl.pct,0)||1;
  const plazos = p.plazos.map(pl=>({
    ...pl,
    factor: 1+(pl.delta/100)
  }));

  // Precio cluster×plazo
  const matrizPrecios = precioCluster.map(pc =>
    plazos.map(pl => ({
      precioM2: pc * pl.factor,
      mensualidad: (pc * pl.factor * m2PorLote * (1-p.pctEnganche/100)) / (pl.meses||1),
    }))
  );

  // Precio promedio residencial ponderado (por plazo)
  const precioPromedioM2Cluster = precioCluster.reduce((a,b)=>a+b,0)/p.numClusters;
  const precioPromedioFinal = plazos.reduce((a,pl)=>a+(pl.pct/totalPctPlazos)*(precioPromedioM2Cluster*pl.factor),0);

  // Comercial
  const preciosComerciales = Array.from({length:p.nivelesComerciales},(_,i)=>
    p.precioBaseM2Comercial*Math.pow(1+p.incrementoComercialPct/100,i));
  const precioPromedioComercial = preciosComerciales.reduce((a,b)=>a+b,0)/p.nivelesComerciales;
  const plazoComercialSel = plazos.find(pl=>pl.meses===p.plazoComercial)||plazos[plazos.length-1];

  // Valores totales
  const valorTotalResidencial = totalResid*m2PorLote*precioPromedioFinal;
  const valorTotalComercial   = p.numLotesComerciales*p.m2Comercial*precioPromedioComercial;
  const valorTotalProyecto    = valorTotalResidencial+valorTotalComercial;
  const totalComisiones       = valorTotalProyecto*(p.pctComision/100);

  // Horizonte
  const mesesVentaResid = Math.ceil(totalResid/ventasMes);
  const mesesVentaComercial = mesInicioComerciales + Math.ceil(p.numLotesComerciales/ventasMes);
  const mesesVenta = Math.max(mesesVentaResid, mesesVentaComercial);
  const HORIZON    = Math.max(mesesVenta+60, 96);
  const nBloques   = Math.ceil(HORIZON/6);

  // Gastos mensuales
  const gastoMes={};
  for(const part of p.partidas){
    const arr=[];
    if(!part.manual){
      const nB=nBloques;
      for(let mes=1;mes<=HORIZON;mes++){
        const b=Math.ceil(mes/6);
        arr.push((part.total*(2*Math.min(b,nB))/(nB*(nB+1)))/6);
      }
    } else {
      // maxBloques: la partida termina en ese bloque, después no gasta
      const maxB=part.maxBloques||part.bloques.length;
      for(let mes=1;mes<=HORIZON;mes++){
        const bi=Math.ceil(mes/6)-1;
        if(bi>=maxB){arr.push(0);continue;}
        const blq=part.bloques[bi];
        if(!blq){arr.push(0);continue;}
        arr.push((part.total*(blq.pct/100))/6);
      }
    }
    gastoMes[part.id]=arr;
  }

  const totalGastosBase = p.partidas.reduce((a,pt)=>a+pt.total,0);
  const gastoPromedio   = totalGastosBase/Math.max(mesesVenta,12);

  // ── MODELO AGREGADO DETERMINÍSTICO (sin cartera individual) ──────────────
  // Para cada mes de venta, calculamos el patrón de cobros que genera
  // y lo distribuimos en un array ingresoPorMes[mes] de forma vectorizada.
  // Esto reemplaza trackear miles de entries en cartera[], eliminando el O(n²).

  // Precio promedio ponderado por plazo para residencial (por cluster luego escalamos)
  // Usamos precio promedio de cluster como proxy (suficientemente preciso para flujo)
  const precioPromedioCluster = precioCluster.reduce((a,b)=>a+b,0)/p.numClusters;

  // Distribución de plazos normalizada
  const plazoDist = plazos.map(pl=>({...pl, w: pl.pct/totalPctPlazos}));

  // Factor de enganche diferido: cuándo llega cada pago de enganche
  const wContado = p.pctVentasEngancheContado/100;
  const w2 = p.pctVentasEnganche2pagos/100;
  const w3 = p.pctVentasEnganche3pagos/100;
  const offsetMens = p.opcionMensualidad==="junto_segundo" ? 1 : 0; // +1 = junto 2do pago

  // Arrays de ingresos [HORIZON+100] inicializados a 0
  const arrEng = new Float64Array(HORIZON+200);
  const arrMens= new Float64Array(HORIZON+200);
  const arrCom = new Float64Array(HORIZON+200);

  let lotesResidVendidos=0, lotesComercVendidos=0;
  let mesFinVentas=null;

  for(let mes=1;mes<=HORIZON;mes++){
    // Ventas de este mes
    const residDisp = totalResid - lotesResidVendidos;
    const vendResidMes = Math.min(ventasMes, Math.max(0,residDisp));
    const pctResidVend = (lotesResidVendidos/totalResid)*100;
    const puedeComercial = pctResidVend >= p.pctInicioComerciales;
    const comercDisp = p.numLotesComerciales - lotesComercVendidos;
    const vendComercMes = puedeComercial ? Math.min(Math.ceil(ventasMes*0.3), Math.max(0,comercDisp)) : 0;

    lotesResidVendidos  += vendResidMes;
    lotesComercVendidos += vendComercMes;
    if((lotesResidVendidos>=totalResid && lotesComercVendidos>=p.numLotesComerciales) && !mesFinVentas)
      mesFinVentas=mes;

    if(vendResidMes>0){
      // Precio promedio del cluster en este rango de lotes (aproximación lineal)
      const clusterFrac = Math.min((lotesResidVendidos-vendResidMes/2)/totalResid, 0.999);
      const clIdx = Math.min(Math.floor(clusterFrac*p.numClusters), p.numClusters-1);
      const pcM2 = precioCluster[clIdx]||precioCluster[0];

      // Para cada plazo, calcular el flujo que genera vendResidMes lotes
      for(const pl of plazoDist){
        const nLotes = vendResidMes * pl.w;
        const pTotal = pcM2 * m2PorLote * pl.factor;
        const eng    = pTotal * (p.pctEnganche/100);
        const resto  = pTotal - eng;
        const comision = eng * (p.pctComision/100);

        // Enganche: distribuido según modalidad
        // Contado (1 pago): mes actual
        arrEng[mes] += nLotes * eng * wContado;
        arrCom[mes] += nLotes * comision;
        // 2 pagos: 50% hoy, 50% mes+1
        arrEng[mes]   += nLotes * eng * w2 * 0.5;
        if(mes+1<arrEng.length) arrEng[mes+1] += nLotes * eng * w2 * 0.5;
        // 3 pagos: 33% hoy, 33% mes+1, 33% mes+2
        arrEng[mes]   += nLotes * eng * w3 / 3;
        if(mes+1<arrEng.length) arrEng[mes+1] += nLotes * eng * w3 / 3;
        if(mes+2<arrEng.length) arrEng[mes+2] += nLotes * eng * w3 / 3;

        if(pl.meses===0){
          // Contado: resto también hoy
          arrEng[mes] += nLotes * resto;
        } else {
          // Mensualidades: cuota fija desde mesInicio hasta mesInicio+meses-1
          const cuota = resto / pl.meses;
          // Inicio: junto 2do pago (mes+1) o después del último (mes+nPagosE)
          // Para w2: mes+1+offsetMens, para w3: mes+2+offsetMens, para contado: mes+1
          const miBase = mes + 1; // onset mínimo
          for(let dm=0; dm<pl.meses; dm++){
            const target = miBase + dm;
            if(target < arrMens.length) arrMens[target] += nLotes * cuota;
          }
        }
      }
    }

    if(vendComercMes>0){
      const pTotal  = p.m2Comercial * precioPromedioComercial;
      const eng     = pTotal * (p.pctEnganche/100);
      const resto   = pTotal - eng;
      arrEng[mes] += vendComercMes * eng;
      arrCom[mes] += vendComercMes * eng * (p.pctComision/100);
      if(plazoComercialSel.meses===0){
        arrEng[mes] += vendComercMes * resto;
      } else {
        const cuota = resto / plazoComercialSel.meses;
        for(let dm=0; dm<plazoComercialSel.meses; dm++){
          const target = mes+1+dm;
          if(target < arrMens.length) arrMens[target] += vendComercMes * cuota;
        }
      }
    }
  }

  // Aplicar efectividad de cobro a mensualidades (morosidad)
  const efectividad = (p.efectividadCobro||85) / 100;
  for(let m=0;m<arrMens.length;m++) arrMens[m] *= efectividad;

  // Modelar cancelaciones: a partir de mesCancelacionInicio, X lotes/mes cancelan.
  // El lote cancelado pierde sus mensualidades futuras pero el lote vuelve al inventario
  // y se revende al precio del cluster vigente ese mes.
  const cancelInicio = p.mesCancelacionInicio || 6;
  const cancelPorMes = p.cancelacionesPorMes || 2;

  // Para cada mes con cancelaciones, reducimos arrMens futuros proporcional a los lotes
  // cancelados vs la cartera activa estimada, y añadimos la reventa como nueva venta.
  // Estimamos cartera activa = lotes vendidos con crédito activo (aprox).
  let lotesEnCarteraEstim = 0;

  // Detectar fin de cobros
  let mesFinCobros = HORIZON;
  for(let m=HORIZON+199;m>mesesVenta;m--){
    if((arrEng[m]||0)+(arrMens[m]||0)>0){ mesFinCobros=m; break; }
  }

  // Construir flujoMensual
  let saldo=0, mesInicioUtil=null, utilBase=null;
  const flujoMensual=[];
  let rvAcum=0, cvAcum=0;
  let lotesRevendidos=0, totalCancelados=0;

  for(let mes=1;mes<=Math.min(HORIZON,mesFinCobros+3);mes++){
    // Ventas regulares
    const residDisp2=totalResid-rvAcum+lotesRevendidos;
    const vr=Math.min(ventasMes,Math.max(0,totalResid-rvAcum));
    const pctRV=(rvAcum/totalResid)*100;
    const pC=pctRV>=p.pctInicioComerciales;
    const vc=pC?Math.min(Math.ceil(ventasMes*0.3),Math.max(0,p.numLotesComerciales-cvAcum)):0;
    rvAcum+=vr; cvAcum+=vc;
    const vendidosMesBase=vr+vc;

    // Cancelaciones a partir del mes de inicio
    let cancelMes=0, ingresosReventa=0;
    if(mes>=cancelInicio && rvAcum>0){
      cancelMes = Math.min(cancelPorMes, Math.max(0, rvAcum-totalCancelados-10));
      totalCancelados += cancelMes;
      // Los lotes cancelados vuelven al inventario (reventa inmediata siguiente mes)
      // Modelamos: reventa genera enganche y nuevas mensualidades
      if(cancelMes>0){
        const clusterFrac = Math.min(rvAcum/totalResid, 0.999);
        const clIdx = Math.min(Math.floor(clusterFrac*p.numClusters), p.numClusters-1);
        const pcM2 = precioCluster[clIdx]||precioCluster[0];
        // Plazo promedio ponderado para reventa
        const precioReventa = pcM2 * m2PorLote * plazoDist.reduce((a,pl)=>a+pl.w*pl.factor,0);
        const engReventa = precioReventa * (p.pctEnganche/100);
        // Enganche de reventa llega al mes siguiente
        if(mes+1<arrEng.length) arrEng[mes+1] += cancelMes * engReventa;
        // Mensualidades de reventa (distribuidas)
        const restoReventa = precioReventa - engReventa;
        const plazoPromPonderado = plazoDist.reduce((a,pl)=>a+pl.w*pl.meses,0);
        const mesesReventa = Math.max(Math.round(plazoPromPonderado),12);
        const cuotaReventa = (restoReventa/mesesReventa)*efectividad;
        for(let dm=1;dm<=mesesReventa;dm++){
          const t=mes+1+dm;
          if(t<arrMens.length) arrMens[t]+=cancelMes*cuotaReventa;
        }
        lotesRevendidos+=cancelMes;
      }
    }

    const engancheMes    = arrEng[mes]||0;
    const mensualidadesMes = arrMens[mes]||0;
    const comisionMes    = arrCom[mes]||0;
    const ingresosBrutos = engancheMes+mensualidadesMes;
    const costoFin       = ingresosBrutos*(p.pctCostoFinanciero/100);
    const ingresoNeto    = ingresosBrutos-costoFin;

    const gastosPartida={};
    for(const part of p.partidas) gastosPartida[part.id]=gastoMes[part.id][mes-1]||0;
    const totalPartidas  = Object.values(gastosPartida).reduce((a,b)=>a+b,0);
    const totalGastosMes = totalPartidas+comisionMes+p.retencionMensual+costoFin;
    const gastoUrbanizacionMes = gastosPartida["urbanizacion"]||0;
    const alertaObra = saldo < gastoUrbanizacionMes && gastoUrbanizacionMes > 0;

    saldo = saldo+ingresoNeto-totalPartidas-comisionMes-p.retencionMensual;

    const reservaMin=gastoPromedio*p.reservaMinima;
    let utilidadMes=0;
    if(saldo>reservaMin&&mes>(mesFinVentas||mesesVenta)*0.5){
      if(!mesInicioUtil){mesInicioUtil=mes;utilBase=(saldo-reservaMin)*p.utilBaseMultiplier;}
      utilidadMes=utilBase*Math.pow(p.utilGrowthRate,mes-mesInicioUtil);
      utilidadMes=Math.min(utilidadMes,Math.max(0,saldo-reservaMin));
      saldo-=utilidadMes;
    }

    flujoMensual.push({
      mes, vendidosMes:vendidosMesBase+cancelMes, vendResidMes:vr, vendComercMes:vc,
      cancelMes, lotesRevendidos,
      lotesResidVendidos:rvAcum, lotesComercVendidos:cvAcum,
      engancheMes, mensualidadesMes, ingresosBrutos, costoFin, ingresoNeto,
      ...gastosPartida, comisionMes, retencion:p.retencionMensual,
      totalGastosMes, utilidadMes, saldo,
      alertaObra,
    });
  }

  if(!mesFinVentas) mesFinVentas=mesesVenta;

  return {
    totalLotes,totalResid,valorTotalProyecto,valorTotalResidencial,valorTotalComercial,
    totalComisiones,totalGastosBase,mesesVenta,mesFinVentas,mesFinCobros,
    mesInicioUtil,flujoMensual,
    precioPromedioFinal,precioCluster,plazos,matrizPrecios,
    precioPromedioComercial,preciosComerciales,
    nBloques,m2PorLote,
  };
}

// ─── UI BASE ──────────────────────────────────────────────────────────────────
const Card=({children,style})=>(
  <div style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:12,padding:18,...style}}>{children}</div>
);
const Label=({children})=>(
  <div style={{marginBottom:5,fontSize:10,fontWeight:700,color:G.textDim,letterSpacing:".08em",textTransform:"uppercase"}}>{children}</div>
);
const STitle=({children,color=G.accent})=>(
  <div style={{fontSize:10,fontWeight:700,color,letterSpacing:".1em",textTransform:"uppercase",
    marginBottom:12,paddingBottom:6,borderBottom:`1px solid ${G.border}`}}>{children}</div>
);
const Stat=({label,value,color=G.text,size=17})=>(
  <div><div className="mono" style={{fontSize:size,fontWeight:500,color}}>{value}</div>
  <div style={{fontSize:10,color:G.textMuted,marginTop:2}}>{label}</div></div>
);
const btnS=(color=G.accent)=>({
  padding:"6px 13px",borderRadius:6,border:`1px solid ${color}`,
  background:`${color}15`,color,fontSize:10,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",
});
const Badge=({ok,children})=>(
  <div style={{padding:"4px 10px",background:ok?G.accentDim:G.redDim,borderRadius:6,display:"inline-block"}}>
    <span className="mono" style={{fontSize:10,color:ok?G.accent:G.red}}>{children}</span>
  </div>
);

// ─── GRÁFICA DE FLUJO — BARRAS APILADAS ──────────────────────────────────────
const FlowChart = React.memo(function FlowChart({flujo, partidas, mesFinVentas, mesFinCobros, mesInicioUtil, mesFinObra, expanded=false}){
  const [hover, setHover] = useState(null);

  // Recortar hasta fin de cobros + 3 meses de margen
  const endMes = Math.min((mesFinCobros||flujo.length) + 3, flujo.length);
  const data = flujo.slice(0, endMes);
  if(!data.length) return null;

  // Capas de gasto en orden de apilado (de abajo a arriba)
  const gastoLayers = [
    ...partidas.map(pt => ({ key: pt.id, label: pt.label, color: pt.color })),
    { key:"comisionMes",  label:"Comisiones", color: G.orange },
    { key:"retencion",    label:"Retenciones", color: G.textMuted },
    { key:"costoFin",     label:"C. Financiero", color: "#64748B" },
    { key:"utilidadMes",  label:"Utilidades", color: G.gold },
  ];

  // Calcular máximo global (ingreso o gasto) para escala común
  const maxVal = Math.max(
    ...data.map(d => d.ingresosBrutos || 0),
    ...data.map(d => d.totalGastosMes + (d.utilidadMes||0) || 0),
    1
  );

  // Dimensiones SVG — más altas en modo expandido
  const SVG_W = expanded ? 1400 : 900;
  const SVG_H = expanded ? 520 : 300;
  const PAD_L = 72;
  const PAD_R = 16;
  const PAD_T = 20;
  const PAD_B = expanded ? 72 : 48;
  const CHART_W = SVG_W - PAD_L - PAD_R;
  const CHART_H = SVG_H - PAD_T - PAD_B;

  const N = data.length;
  // Cada mes ocupa un slot; barras de ingreso y gasto lado a lado
  const slotW = CHART_W / N;
  const barW  = Math.max(slotW * 0.42, 0.8);
  const gap   = slotW * 0.06;

  const xLeft  = (i) => PAD_L + i * slotW + gap;                 // barra ingreso
  const xRight = (i) => PAD_L + i * slotW + slotW * 0.5 + gap;  // barra gasto
  const yBase  = PAD_T + CHART_H;
  const yOf    = (v) => PAD_T + CHART_H - (v / maxVal) * CHART_H;
  const hOf    = (v) => (v / maxVal) * CHART_H;

  // Ticks eje Y
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: maxVal * f, y: yOf(maxVal * f) }));

  // Ticks eje X — cada 6 meses
  const xTicks = [];
  for(let i = 0; i < N; i += 6) xTicks.push(i);

  // Líneas de hito
  const hitos = [
    { mes: mesFinVentas,   color: G.accent,  label: "Fin ventas" },
    mesFinObra ? { mes: mesFinObra, color: G.blue, label: "Fin obra" } : null,
    mesInicioUtil ? { mes: mesInicioUtil, color: G.gold, label: "Ini. util." } : null,
    { mes: mesFinCobros,   color: G.purple,  label: "Fin cobros" },
  ].filter(Boolean);

  // Tooltip
  const renderTooltip = () => {
    if(hover === null || !data[hover]) return null;
    const d = data[hover];
    const x = PAD_L + hover * slotW + slotW / 2;
    const tipW = 160, tipH = 130;
    const tx = Math.min(x - tipW/2, SVG_W - tipW - 4);
    const ty = PAD_T;
    return (
      <g>
        <rect x={tx} y={ty} width={tipW} height={tipH} rx={6}
          fill={G.surface} stroke={G.border} strokeWidth={1} opacity={0.97}/>
        <text x={tx+8} y={ty+14} fill={G.accent} fontSize={9} fontWeight="700"
          fontFamily="IBM Plex Mono">Mes {d.mes}</text>
        <text x={tx+8} y={ty+27} fill={G.accent} fontSize={9} fontFamily="IBM Plex Mono">
          Enganche: {fmtMM(d.engancheMes)}
        </text>
        <text x={tx+8} y={ty+40} fill={G.purple} fontSize={9} fontFamily="IBM Plex Mono">
          Mensual.: {fmtMM(d.mensualidadesMes)}
        </text>
        <text x={tx+8} y={ty+53} fill={G.text} fontSize={9} fontFamily="IBM Plex Mono">
          T.Ingr.: {fmtMM(d.ingresosBrutos)}
        </text>
        <line x1={tx+8} y1={ty+59} x2={tx+tipW-8} y2={ty+59} stroke={G.border} strokeWidth={0.5}/>
        <text x={tx+8} y={ty+72} fill={G.red} fontSize={9} fontFamily="IBM Plex Mono">
          T.Gasto: {fmtMM(d.totalGastosMes)}
        </text>
        <text x={tx+8} y={ty+85} fill={G.gold} fontSize={9} fontFamily="IBM Plex Mono">
          Utilidad: {fmtMM(d.utilidadMes)}
        </text>
        <line x1={tx+8} y1={ty+91} x2={tx+tipW-8} y2={ty+91} stroke={G.border} strokeWidth={0.5}/>
        <text x={tx+8} y={ty+104} fill={d.saldo>=0?G.accent:G.red} fontSize={9}
          fontWeight="700" fontFamily="IBM Plex Mono">
          Saldo: {fmtMM(d.saldo)}
        </text>
        <text x={tx+8} y={ty+117} fill={G.textMuted} fontSize={9} fontFamily="IBM Plex Mono">
          Vendidos: {d.vendidosMes} lotes
        </text>
      </g>
    );
  };

  // Construir barras de gasto apiladas
  const buildGastoStack = (d) => {
    const segs = [];
    let yAccum = 0;
    for(const layer of gastoLayers){
      const v = d[layer.key] || 0;
      if(v > 0) segs.push({ ...layer, v, yAccum });
      yAccum += v;
    }
    return segs;
  };

  // Leyenda items (deduplicados por color)
  const legendItems = [
    { color: G.accent,  label: "Enganche" },
    { color: G.purple,  label: "Mensualidades" },
    ...gastoLayers.map(l => ({ color: l.color, label: l.label })),
  ];
  // Quitar duplicados de color
  const seenColors = new Set();
  const legendUniq = legendItems.filter(l => {
    if(seenColors.has(l.color)) return false;
    seenColors.add(l.color); return true;
  });

  return (
    <div style={{width:"100%",overflowX:"auto"}}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{width:"100%", minWidth: expanded ? 900 : 500, height:"auto", display:"block"}}
        onMouseLeave={()=>setHover(null)}
      >
        {/* Fondo */}
        <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="transparent"/>

        {/* Grid horizontal */}
        {yTicks.map(({v,y}) => (
          <g key={v}>
            <line x1={PAD_L} y1={y} x2={SVG_W-PAD_R} y2={y}
              stroke={G.border} strokeWidth={v===0?1:0.4} opacity={0.6}/>
            <text x={PAD_L-5} y={y+3} fill={G.textMuted} fontSize={8}
              fontFamily="IBM Plex Mono" textAnchor="end">{fmtMM(v)}</text>
          </g>
        ))}

        {/* Barras por mes */}
        {data.map((d,i) => {
          const xl = xLeft(i);
          const xr = xRight(i);
          const isHov = hover===i;

          // Barra ingreso: enganche abajo, mensualidades arriba
          const hEng  = hOf(d.engancheMes||0);
          const hMens = hOf(d.mensualidadesMes||0);
          const yEng  = yBase - hEng;
          const yMens = yEng - hMens;

          // Barras gasto apilado
          const gastoSegs = buildGastoStack(d);

          return (
            <g key={i}
              onMouseEnter={()=>setHover(i)}
              style={{cursor:"crosshair"}}>

              {/* Fondo hover */}
              {isHov && <rect x={PAD_L+i*slotW} y={PAD_T} width={slotW} height={CHART_H}
                fill={G.accent} opacity={0.04}/>}

              {/* Barra ingreso — enganche */}
              {hEng > 0.3 && <rect x={xl} y={yEng} width={barW} height={hEng}
                fill={G.accent} opacity={isHov?1:0.75}/>}
              {/* Barra ingreso — mensualidades */}
              {hMens > 0.3 && <rect x={xl} y={yMens} width={barW} height={hMens}
                fill={G.purple} opacity={isHov?1:0.75}/>}

              {/* Barras gasto apiladas */}
              {gastoSegs.map((seg,si) => {
                const hSeg = hOf(seg.v);
                const ySeg = yBase - hOf(seg.yAccum + seg.v);
                return hSeg > 0.3 ? (
                  <rect key={si} x={xr} y={ySeg} width={barW} height={hSeg}
                    fill={seg.color} opacity={isHov?0.95:0.7}/>
                ) : null;
              })}
            </g>
          );
        })}

        {/* Líneas de hito */}
        {hitos.map(({mes,color,label}) => {
          if(!mes || mes < 1 || mes > N) return null;
          const x = PAD_L + (mes-1) * slotW + slotW/2;
          return (
            <g key={label}>
              <line x1={x} y1={PAD_T} x2={x} y2={yBase}
                stroke={color} strokeWidth={1.5} strokeDasharray="5,3" opacity={0.9}/>
              <rect x={x-28} y={PAD_T+2} width={56} height={13} rx={3}
                fill={color} opacity={0.15}/>
              <text x={x} y={PAD_T+12} fill={color} fontSize={8} fontWeight="700"
                fontFamily="IBM Plex Mono" textAnchor="middle">{label}</text>
            </g>
          );
        })}

        {/* Eje X — ticks cada 6 meses */}
        {xTicks.map(i => {
          const x = PAD_L + i * slotW + slotW/2;
          return (
            <g key={i}>
              <line x1={x} y1={yBase} x2={x} y2={yBase+4} stroke={G.border} strokeWidth={0.8}/>
              <text x={x} y={yBase+13} fill={G.textMuted} fontSize={8}
                fontFamily="IBM Plex Mono" textAnchor="middle">M{i+1}</text>
            </g>
          );
        })}

        {/* Línea base eje X */}
        <line x1={PAD_L} y1={yBase} x2={SVG_W-PAD_R} y2={yBase} stroke={G.border} strokeWidth={1}/>
        {/* Línea eje Y */}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={yBase} stroke={G.border} strokeWidth={1}/>

        {/* Label ejes */}
        <text x={12} y={PAD_T + CHART_H/2} fill={G.textMuted} fontSize={8}
          fontFamily="IBM Plex Mono" textAnchor="middle"
          transform={`rotate(-90, 12, ${PAD_T + CHART_H/2})`}>MXN / mes</text>
        <text x={PAD_L + CHART_W/2} y={SVG_H-4} fill={G.textMuted} fontSize={8}
          fontFamily="IBM Plex Mono" textAnchor="middle">Mes del proyecto</text>

        {/* Leyenda columnas */}
        <text x={PAD_L + barW/2 + 2} y={yBase+26} fill={G.textMuted} fontSize={7}
          fontFamily="IBM Plex Mono" textAnchor="middle">INGR.</text>
        <text x={PAD_L + slotW*0.5 + barW/2 + gap} y={yBase+26} fill={G.textMuted} fontSize={7}
          fontFamily="IBM Plex Mono" textAnchor="middle">GASTO</text>

        {/* Tooltip */}
        {renderTooltip()}

        {/* Leyenda bottom — colores */}
        {legendUniq.slice(0,10).map(({color,label},i) => {
          const lx = PAD_L + i * ((CHART_W) / Math.min(legendUniq.length,10));
          const ly = SVG_H - 14;
          return (
            <g key={label} transform={`translate(${lx},${ly})`}>
              <rect x={0} y={-6} width={8} height={8} rx={2} fill={color} opacity={0.8}/>
              <text x={11} y={0} fill={G.textMuted} fontSize={7.5}
                fontFamily="IBM Plex Mono">{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

// ─── EXPORTAR EXCEL ──────────────────────────────────────────────────────────
function exportarExcel(flujo, partidas, params, label, result) {
  // Construir CSV con todos los datos
  const cols = [
    "Mes","Lotes Vendidos (mes)","Lotes Acum.",
    "Enganche","Mensualidades","Total Ingresos","Costo Financiero","Ingreso Neto",
    ...partidas.flatMap(pt=>[pt.label+" (mes)", pt.label+" (acum)", pt.label+" % ppto"]),
    "Comisiones (mes)","Comisiones (acum)",
    "Retenciones","Total Gastos",
    "Utilidad (mes)","Utilidad (acum)","Saldo"
  ];

  // Pre-calcular acumulados
  const acumRun = {};
  for(const pt of partidas) acumRun[pt.id]=0;
  acumRun.com=0; acumRun.util=0;

  const rows = flujo.map(f => {
    for(const pt of partidas) acumRun[pt.id]+=(f[pt.id]||0);
    acumRun.com+=f.comisionMes;
    acumRun.util+=f.utilidadMes;
    return [
      f.mes, f.vendidosMes, f.lotesResidVendidos+(f.lotesComercVendidos||0),
      Math.round(f.engancheMes), Math.round(f.mensualidadesMes),
      Math.round(f.ingresosBrutos), Math.round(f.costoFin), Math.round(f.ingresoNeto),
      ...partidas.flatMap(pt=>[
        Math.round(f[pt.id]||0),
        Math.round(acumRun[pt.id]),
        parseFloat(((acumRun[pt.id]/pt.total)*100).toFixed(1))
      ]),
      Math.round(f.comisionMes), Math.round(acumRun.com),
      Math.round(f.retencion), Math.round(f.totalGastosMes),
      Math.round(f.utilidadMes), Math.round(acumRun.util),
      Math.round(f.saldo)
    ];
  });

  // Hoja 2 — Resumen del proyecto
  const resumen = [
    ["RESUMEN DEL PROYECTO",""],
    ["Escenario", label],
    ["Lotes residenciales", result.totalResid],
    ["Lotes comerciales", result.totalLotes - result.totalResid],
    ["Lotes totales", result.totalLotes],
    ["Valor total proyecto", Math.round(result.valorTotalProyecto)],
    ["Valor residencial", Math.round(result.valorTotalResidencial)],
    ["Valor comercial", Math.round(result.valorTotalComercial)],
    ["Comisiones estimadas", Math.round(result.totalComisiones)],
    ["Total costos", Math.round(result.totalGastosBase + result.totalComisiones)],
    ["Utilidad bruta estimada", Math.round(result.valorTotalProyecto - result.totalGastosBase - result.totalComisiones)],
    ["Meses de venta", result.mesesVenta],
    ["Mes fin ventas", result.mesFinVentas],
    ["Mes fin cobros", result.mesFinCobros],
    ["Mes inicio utilidades", result.mesInicioUtil||"—"],
    [""],
    ["PRECIOS POR CLUSTER",""],
    ["Cluster","Precio m²"],
    ...result.precioCluster.map((pc,i)=>[`Cluster ${i+1}`, Math.round(pc)]),
    [""],
    ["TABLA CLUSTER × PLAZO (Precio m²)",""],
    ["Cluster", ...result.plazos.map(pl=>pl.label)],
    ...result.precioCluster.map((pc,i)=>[
      `C${i+1}`,
      ...result.plazos.map(pl=>Math.round(pc*pl.factor))
    ]),
    [""],
    ["TABLA CLUSTER × PLAZO (Mensualidad)",""],
    ["Cluster", ...result.plazos.map(pl=>pl.label)],
    ...result.precioCluster.map((pc,i)=>[
      `C${i+1}`,
      ...result.plazos.map(pl=>pl.meses>0?Math.round((pc*pl.factor*result.m2PorLote*(1-params.pctEnganche/100))/pl.meses):"CONTADO")
    ]),
  ];

  // Convertir a CSV
  const NL = "\n";
  const escapeCSV = (v) => {
    const s = String(v);
    return (s.indexOf(',')>=0||s.indexOf('"')>=0) ? '"'+s.replace(/"/g,'""')+'"' : s;
  };
  const toCSV = (data) => data.map(row => row.map(escapeCSV).join(',')).join(NL);

  const csvContent = [
    "FLUJO MENSUAL - "+label,
    cols.map(escapeCSV).join(','),
    toCSV(rows),
    "",
    toCSV(resumen),
  ].join(NL);

  const blob = new Blob([csvContent], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "amarah2_flujo_"+label.replace(/[^a-zA-Z0-9]/g,'_')+".csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── PANEL GASTOS CON SLIDERS// ─── PANEL GASTOS CON SLIDERS ─────────────────────────────────────────────────
function GastosPanel({params,setParams,nBloques}){
  const updPartida=(i,k,v)=>setParams(p=>{const pts=[...p.partidas];pts[i]={...pts[i],[k]:v};return{...p,partidas:pts};});

  // Actualiza bloque bi con valor v, y rebalancea el resto para mantener 100%
  const updBloqueRebalance=(pi,bi,newVal)=>setParams(p=>{
    const pts=[...p.partidas];
    const bls=pts[pi].bloques.map((b,i)=>({...b}));
    const activeN=bls.length;
    const oldVal=bls[bi].pct;
    const delta=newVal-oldVal;
    // Otros bloques (excepto el actual) a redistribuir el delta inverso
    const others=bls.map((_,i)=>i).filter(i=>i!==bi);
    const totalOthers=others.reduce((a,i)=>a+bls[i].pct,0);
    if(totalOthers>0){
      others.forEach(i=>{
        bls[i].pct=Math.max(0, bls[i].pct - (bls[i].pct/totalOthers)*delta);
      });
    }
    bls[bi].pct=newVal;
    // Normalizar para asegurar suma=100
    const sum=bls.reduce((a,b)=>a+b.pct,0);
    if(sum>0) bls.forEach(b=>b.pct=parseFloat(((b.pct/sum)*100).toFixed(2)));
    pts[pi]={...pts[pi],bloques:bls};
    return{...p,partidas:pts};
  });

  const activarManual=(pi,maxB)=>setParams(p=>{
    const pts=[...p.partidas];
    const n=maxB||nBloques;
    pts[pi]={...pts[pi],manual:true,maxBloques:n,bloques:genBloques(n,pts[pi].total)};
    return{...p,partidas:pts};
  });

  const cambiarMaxBloques=(pi,n)=>setParams(p=>{
    const pts=[...p.partidas];
    pts[pi]={...pts[pi],maxBloques:n,bloques:genBloques(n,pts[pi].total)};
    return{...p,partidas:pts};
  });

  return(
    <div style={{display:"grid",gap:16}}>
      <div style={{padding:"9px 13px",background:G.accentDim,borderRadius:8,fontSize:11,color:G.accent}}>
        Horizonte total: <strong>{nBloques} bloques</strong> de 6 meses.
        En modo <strong>Manual</strong>: define cuántos bloques dura la partida y mueve los sliders —
        el resto se rebalancea automáticamente para mantener el 100%.
      </div>

      {params.partidas.map((part,pi)=>{
        const activeBloques=part.manual?(part.maxBloques||part.bloques.length):nBloques;
        const totalPct=part.manual?part.bloques.reduce((a,b)=>a+b.pct,0):100;
        const ok=Math.abs(totalPct-100)<1;
        return(
          <div key={part.id} style={{border:`1px solid ${part.manual?part.color+"50":G.border}`,
            borderRadius:10,padding:14,background:part.manual?`${part.color}04`:"transparent"}}>

            {/* Header fila */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:part.color}}/>
                <span style={{fontSize:12,fontWeight:700,color:part.color}}>{part.label}</span>
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:20,
                  background:part.manual?`${part.color}20`:G.surfaceLight,
                  color:part.manual?part.color:G.textMuted,fontWeight:600}}>
                  {part.manual?"MANUAL":"AUTO"}
                </span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <MoneyInput value={part.total} onChange={v=>updPartida(pi,"total",v)} style={{width:140}}/>
                {part.manual&&(
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,color:G.textMuted,whiteSpace:"nowrap"}}>Hasta bloque:</span>
                    <select value={activeBloques}
                      onChange={e=>cambiarMaxBloques(pi,parseInt(e.target.value))}
                      style={{width:80,fontSize:11,padding:"4px 6px"}}>
                      {Array.from({length:nBloques},(_,i)=>(
                        <option key={i+1} value={i+1}>B{i+1} (M{(i+1)*6})</option>
                      ))}
                    </select>
                  </div>
                )}
                <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",whiteSpace:"nowrap"}}>
                  <input type="checkbox" checked={part.manual}
                    onChange={e=>{if(e.target.checked)activarManual(pi);else updPartida(pi,"manual",false);}}
                    style={{accentColor:G.accent,cursor:"pointer"}}/>
                  <span style={{fontSize:10,color:G.textMuted}}>Manual</span>
                </label>
              </div>
            </div>

            {part.manual?(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <Badge ok={ok}>
                    {ok?"✓ 100% distribuido":`Total: ${fmt(totalPct,1)}% — rebalanceando…`}
                  </Badge>
                  <span style={{fontSize:10,color:G.textMuted}}>
                    {activeBloques} bloques · hasta Mes {activeBloques*6} · {fmtMM(part.total)} total
                  </span>
                </div>
                <div style={{display:"grid",gap:7}}>
                  {part.bloques.map((blq,bi)=>{
                    const montoBlq=part.total*(blq.pct/100);
                    const montoMes=montoBlq/6;
                    // Suma de todas las partidas en este bloque para dar contexto de gasto total
                    const totalTodasPartidas=params.partidas.reduce((a,pt)=>{
                      if(!pt.manual) return a; // auto: no calculable fácil aquí
                      const b2=pt.bloques[bi];
                      return b2?a+(pt.total*(b2.pct/100))/6:a;
                    },0);
                    return(
                      <div key={bi} style={{display:"grid",gridTemplateColumns:"88px 1fr 68px 96px",
                        gap:8,alignItems:"center"}}>
                        <span style={{fontSize:10,color:G.textMuted,fontFamily:"'IBM Plex Mono',monospace"}}>
                          B{bi+1} · M{bi*6+1}–{(bi+1)*6}
                        </span>
                        <input type="range" min={0} max={100} step={0.5} value={blq.pct}
                          onChange={e=>updBloqueRebalance(pi,bi,parseFloat(e.target.value))}
                          style={{accentColor:part.color}}/>
                        <span className="mono" style={{fontSize:10,color:part.color,textAlign:"right",fontWeight:600}}>
                          {fmt(blq.pct,1)}%
                        </span>
                        <span className="mono" style={{fontSize:10,color:G.textDim,textAlign:"right"}}>
                          {fmtMM(montoMes)}/mes
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Totales por bloque sumando todas las partidas manuales */}
                {params.partidas.some(pt=>pt.manual)&&(
                  <div style={{marginTop:8,padding:"8px 10px",background:G.surfaceLight,borderRadius:7}}>
                    <div style={{fontSize:9,color:G.textMuted,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginBottom:6}}>
                      Gasto mensual total por bloque (suma todas las partidas manuales)
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {Array.from({length:part.bloques.length},(_,bi)=>{
                        const totalMes=params.partidas.reduce((a,pt)=>{
                          if(!pt.manual) return a;
                          const blq=pt.bloques[bi];
                          return blq?a+(pt.total*(blq.pct/100))/6:a;
                        },0);
                        return totalMes>0?(
                          <div key={bi} style={{padding:"4px 8px",background:`${part.color}15`,borderRadius:5,
                            border:`1px solid ${part.color}30`}}>
                            <div style={{fontSize:8,color:G.textMuted}}>B{bi+1} M{bi*6+1}-{(bi+1)*6}</div>
                            <div className="mono" style={{fontSize:10,color:part.color,fontWeight:600}}>{fmtMM(totalMes)}/mes</div>
                          </div>
                        ):null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ):(
              <span style={{fontSize:11,color:G.textMuted,fontStyle:"italic"}}>
                Distribución automática progresiva — {fmtMM(part.total/nBloques/6)}/mes promedio inicial
              </span>
            )}
          </div>
        );
      })}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,padding:14,
        background:G.surfaceLight,borderRadius:10}}>
        <div>
          <Label>Retenciones IVA/ISR — fijo mensual</Label>
          <MoneyInput value={params.retencionMensual} onChange={v=>setParams(p=>({...p,retencionMensual:v}))}/>
        </div>
        <div>
          <Label>% Costo financiero sobre cobros</Label>
          <PctInput value={params.pctCostoFinanciero} onChange={v=>setParams(p=>({...p,pctCostoFinanciero:v}))}/>
        </div>
      </div>
    </div>
  );
}

// ─── PANEL PARÁMETROS ─────────────────────────────────────────────────────────
function ParamPanel({params,setParams,result}){
  const [tab,setTab]=useState("terrenos");
  const upd=(k,v)=>setParams(p=>({...p,[k]:v}));
  const updLote=(i,k,v)=>setParams(p=>{const l=[...p.lotes];l[i]={...l[i],[k]:v};return{...p,lotes:l};});
  const updCluster=(i,k,v)=>setParams(p=>{const c=[...p.clusters];c[i]={...c[i],[k]:v};return{...p,clusters:c};});
  const updPlazo=(i,k,v)=>setParams(p=>{const pl=[...p.plazos];pl[i]={...pl[i],[k]:v};return{...p,plazos:pl};});

  const totalLotePct=params.lotes.reduce((a,l)=>a+l.pct,0)||1;
  const totalPlazoPct=params.plazos.reduce((a,pl)=>a+pl.pct,0);
  const totalEngPct=params.pctVentasEngancheContado+params.pctVentasEnganche2pagos+params.pctVentasEnganche3pagos;
  const m2Vendible=params.hectareas*10000*(params.pctVendible/100);
  const m2PorLote=params.lotes.reduce((a,l)=>a+l.m2*(l.pct/totalLotePct),0);
  const totalResidEstim=Math.floor(m2Vendible/m2PorLote);
  const nBloques=result?.nBloques||8;

  const TABS=[
    {id:"terrenos",label:"Terrenos"},
    {id:"clusters",label:"Clusters"},
    {id:"precios",label:"Precios / Plazos"},
    {id:"pagos",label:"Pagos"},
    {id:"gastos",label:"Gastos por Bloque"},
    {id:"utilidades",label:"Utilidades"},
  ];

  // Precios cluster × plazo para la tabla
  const precioClusterEst=[];
  let acum=1;
  for(let i=0;i<params.numClusters;i++){
    const c=params.clusters[i];
    if(c.activoPrecioFijo&&c.precioFijo){precioClusterEst.push(c.precioFijo);acum=c.precioFijo/params.precioBaseM2;}
    else{acum*=1+(c.incrementoPct||0)/100;precioClusterEst.push(params.precioBaseM2*acum);}
  }

  return(
    <div>
      <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:`1px solid ${G.border}`,flexWrap:"wrap"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={tab===t.id?"tab-on":""}
            style={{padding:"8px 13px",background:"transparent",border:"none",
              borderBottom:"2px solid transparent",color:G.textMuted,fontSize:11,fontWeight:600}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==="terrenos"&&(
        <div style={{display:"grid",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><Label>Hectáreas totales</Label><MoneyInput value={params.hectareas} onChange={v=>upd("hectareas",v)} prefix=""/></div>
            <div><Label>% Área vendible</Label><PctInput value={params.pctVendible} onChange={v=>upd("pctVendible",v)}/></div>
          </div>
          <div style={{padding:"8px 12px",background:G.accentDim,borderRadius:7}}>
            <span className="mono" style={{fontSize:11,color:G.accent}}>
              m² vendibles: {fmt(m2Vendible,0)} · m² prom/lote: {fmt(m2PorLote,1)} · Lotes resid. est.: <strong>{fmt(totalResidEstim,0)}</strong>
            </span>
          </div>

          <STitle>Tipos de lote (6 tamaños)</STitle>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {params.lotes.map((l,i)=>{
              const pctNorm=l.pct/totalLotePct;
              const numLotes=Math.round(totalResidEstim*pctNorm);
              return(
                <div key={i} style={{background:G.surfaceLight,borderRadius:8,padding:10}}>
                  <div style={{fontSize:9,color:G.textMuted,marginBottom:6,fontWeight:700}}>LOTE {i+1}</div>
                  <div style={{display:"grid",gap:6}}>
                    <div><Label>m²</Label><SmallNum value={l.m2} onChange={v=>updLote(i,"m2",v)} min={10}/></div>
                    <div><Label>% del mix</Label><PctInput value={l.pct} onChange={v=>updLote(i,"pct",v)}/></div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                      <span className="mono" style={{fontSize:9,color:G.textMuted}}>norm: {fmt(pctNorm*100,1)}%</span>
                      <span className="mono" style={{fontSize:9,color:G.accent}}>≈ {numLotes} lotes</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Badge ok>{fmt(totalLotePct,0)}% — se normaliza automáticamente</Badge>

          <STitle>Zona Comercial</STitle>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            <div><Label># Lotes</Label><SmallNum value={params.numLotesComerciales} onChange={v=>upd("numLotesComerciales",v)}/></div>
            <div><Label>m² por lote</Label><SmallNum value={params.m2Comercial} onChange={v=>upd("m2Comercial",v)} min={10}/></div>
            <div><Label>Niveles precio</Label><SmallNum value={params.nivelesComerciales} onChange={v=>upd("nivelesComerciales",clamp(Math.round(v),1,10))} min={1} max={10}/></div>
            <div><Label>% incr. entre niveles</Label><PctInput value={params.incrementoComercialPct} onChange={v=>upd("incrementoComercialPct",v)}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div><Label>Precio base m² comercial</Label><MoneyInput value={params.precioBaseM2Comercial} onChange={v=>upd("precioBaseM2Comercial",v)}/></div>
            <div><Label>Plazo de crédito comerciales</Label>
              <select value={params.plazoComercial} onChange={e=>upd("plazoComercial",parseInt(e.target.value))}>
                {params.plazos.map(pl=><option key={pl.meses} value={pl.meses}>{pl.label}</option>)}
              </select>
            </div>
            <div><Label>Arrancan comerciales al % vendido resid.</Label>
              <PctInput value={params.pctInicioComerciales} onChange={v=>upd("pctInicioComerciales",v)}/>
            </div>
          </div>

          {/* Tabla de niveles comerciales */}
          <STitle>Precios por nivel comercial</STitle>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
            {Array.from({length:params.nivelesComerciales},(_,i)=>{
              const precio=params.precioBaseM2Comercial*Math.pow(1+params.incrementoComercialPct/100,i);
              const plazoComSel=params.plazos.find(pl=>pl.meses===params.plazoComercial)||params.plazos[params.plazos.length-1];
              const mensual=(precio*params.m2Comercial*(1-params.pctEnganche/100))/Math.max(plazoComSel.meses,1);
              return(
                <div key={i} style={{padding:"10px",background:G.surfaceLight,borderRadius:8,border:`1px solid ${G.border}`}}>
                  <div style={{fontSize:9,color:G.textMuted,marginBottom:4}}>NIVEL {i+1}</div>
                  <div className="mono" style={{fontSize:13,color:G.blue,fontWeight:600}}>{fmtM(precio)}/m²</div>
                  <div className="mono" style={{fontSize:10,color:G.textDim,marginTop:4}}>Total: {fmtMM(precio*params.m2Comercial)}</div>
                  <div className="mono" style={{fontSize:9,color:G.textMuted,marginTop:3}}>
                    {plazoComSel.meses>0?`${fmt(plazoComSel.meses,0)}m → ${fmtMM(mensual)}/mes`:"Contado"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab==="clusters"&&(
        <div style={{display:"grid",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><Label># Clusters</Label>
              <SmallNum value={params.numClusters} min={1} max={20} onChange={v=>{
                const n=clamp(Math.round(v),1,20);
                const clusters=Array.from({length:n},(_,i)=>params.clusters[i]||{incrementoPct:5,precioFijo:null,activoPrecioFijo:false});
                setParams(p=>({...p,numClusters:n,clusters}));
              }}/>
            </div>
            <div><Label>Precio base m² residencial (Cluster 1)</Label><MoneyInput value={params.precioBaseM2} onChange={v=>upd("precioBaseM2",v)}/></div>
          </div>
          <STitle>Incremento por cluster — precio resultante</STitle>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {params.clusters.slice(0,params.numClusters).map((c,i)=>(
              <div key={i} style={{background:G.surfaceLight,borderRadius:8,padding:10}}>
                <div style={{fontSize:9,color:G.accent,marginBottom:8,fontWeight:700}}>CLUSTER {i+1}</div>
                <div style={{display:"grid",gap:6}}>
                  <div><Label>% incremento sobre anterior</Label>
                    <PctInput value={c.incrementoPct} onChange={v=>updCluster(i,"incrementoPct",v)}/>
                  </div>
                  <div><Label>Precio fijo m² (opc.)</Label>
                    <MoneyInput value={c.precioFijo||0} onChange={v=>updCluster(i,"precioFijo",v)}/>
                  </div>
                  <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
                    <input type="checkbox" checked={c.activoPrecioFijo}
                      onChange={e=>updCluster(i,"activoPrecioFijo",e.target.checked)}
                      style={{accentColor:G.accent}}/>
                    <span style={{fontSize:10,color:G.textMuted}}>Usar precio fijo</span>
                  </label>
                </div>
                {/* Precio resultante */}
                <div style={{marginTop:8,padding:"6px 8px",background:`${G.accent}10`,borderRadius:6}}>
                  <span style={{fontSize:9,color:G.textMuted}}>Precio resultante: </span>
                  <span className="mono" style={{fontSize:12,color:G.accent,fontWeight:700}}>
                    {fmtM(precioClusterEst[i]||0)}/m²
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="precios"&&(
        <div style={{display:"grid",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <Label>Plazo base (sin ajuste de precio)</Label>
              <select value={params.plazoBase} onChange={e=>upd("plazoBase",parseInt(e.target.value))}>
                {params.plazos.map(pl=><option key={pl.meses} value={pl.meses}>{pl.label}</option>)}
              </select>
              <div style={{fontSize:10,color:G.textMuted,marginTop:5}}>
                Plazos menores = descuento · Plazos mayores = incremento
              </div>
            </div>
            <div><Label>Precio base m² (Cluster 1, plazo base)</Label><MoneyInput value={params.precioBaseM2} onChange={v=>upd("precioBaseM2",v)}/></div>
          </div>

          <STitle>Plazos — delta y distribución de ventas</STitle>
          <div style={{display:"grid",gap:5}}>
            <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1.2fr 1fr",gap:6,marginBottom:4}}>
              {["Plazo","% Ventas","Delta %","Resultado C1 m²"].map(h=>(
                <span key={h} style={{fontSize:9,color:G.textMuted,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>{h}</span>
              ))}
            </div>
            {params.plazos.map((pl,i)=>{
              const isBase=pl.meses===params.plazoBase;
              const precio=params.precioBaseM2*(1+(pl.delta/100));
              return(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1.2fr 1fr",gap:6,
                  alignItems:"center",padding:"5px 8px",borderRadius:6,
                  background:isBase?G.goldDim:"transparent",border:`1px solid ${isBase?G.gold+"30":"transparent"}`}}>
                  <span className="mono" style={{fontSize:11,color:isBase?G.gold:G.textDim}}>
                    {pl.label}{isBase?" ★ BASE":""}
                  </span>
                  <PctInput value={pl.pct} onChange={v=>updPlazo(i,"pct",v)}/>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <SmallNum value={pl.delta} onChange={v=>updPlazo(i,"delta",v)} min={-50} max={50}/>
                    <span style={{fontSize:10,color:pl.delta>0?G.accent:pl.delta<0?G.red:G.textMuted}}>
                      {pl.delta>0?`+${pl.delta}%`:pl.delta<0?`${pl.delta}%`:"BASE"}
                    </span>
                  </div>
                  <span className="mono" style={{fontSize:11,color:G.text}}>{fmtM(precio)}/m²</span>
                </div>
              );
            })}
          </div>
          <Badge ok={Math.abs(totalPlazoPct-100)<1}>Total %: {fmt(totalPlazoPct,1)}%</Badge>

          {/* Tabla cruzada: Cluster × Plazo */}
          <STitle color={G.gold}>Tabla cruzada: Precio m² por Cluster × Plazo</STitle>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>
              <thead>
                <tr>
                  <th style={{padding:"5px 8px",background:G.surfaceLight,color:G.textMuted,textAlign:"left",fontSize:9}}>Cluster</th>
                  {params.plazos.map(pl=>(
                    <th key={pl.meses} style={{padding:"5px 8px",background:G.surfaceLight,
                      color:pl.meses===params.plazoBase?G.gold:G.textMuted,textAlign:"right",fontSize:9,
                      borderLeft:`1px solid ${G.border}`}}>
                      {pl.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {precioClusterEst.map((pc,ci)=>(
                  <tr key={ci} style={{background:ci%2===0?`${G.surfaceLight}40`:"transparent"}}>
                    <td style={{padding:"5px 8px",color:G.accent,fontWeight:700}}>C{ci+1} — {fmtM(pc)}</td>
                    {params.plazos.map((pl,pi)=>{
                      const precioM2=pc*(1+pl.delta/100);
                      const mensual=(precioM2*m2PorLote*(1-params.pctEnganche/100))/Math.max(pl.meses,1);
                      return(
                        <td key={pi} style={{padding:"5px 8px",textAlign:"right",
                          borderLeft:`1px solid ${G.border}30`,
                          background:pl.meses===params.plazoBase?G.goldDim:"transparent"}}>
                          <div style={{color:G.text}}>{fmtM(precioM2)}</div>
                          {pl.meses>0&&<div style={{fontSize:8,color:G.textMuted}}>{fmtMM(mensual)}/mes</div>}
                          {pl.meses===0&&<div style={{fontSize:8,color:G.accent}}>CONTADO</div>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="pagos"&&(
        <div style={{display:"grid",gap:14}}>
          <STitle>Enganche</STitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><Label>% Enganche sobre precio total</Label><PctInput value={params.pctEnganche} onChange={v=>upd("pctEnganche",v)}/></div>
            <div><Label>% Comisión de venta</Label><PctInput value={params.pctComision} onChange={v=>upd("pctComision",v)}/></div>
          </div>
          <STitle>Modalidad de pago de enganche</STitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div><Label>% Contado (1 pago)</Label><PctInput value={params.pctVentasEngancheContado} onChange={v=>upd("pctVentasEngancheContado",v)}/></div>
            <div><Label>% Diferido 2 pagos</Label><PctInput value={params.pctVentasEnganche2pagos} onChange={v=>upd("pctVentasEnganche2pagos",v)}/></div>
            <div><Label>% Diferido 3 pagos</Label><PctInput value={params.pctVentasEnganche3pagos} onChange={v=>upd("pctVentasEnganche3pagos",v)}/></div>
          </div>
          <Badge ok={Math.abs(totalEngPct-100)<1}>Total: {fmt(totalEngPct,0)}%</Badge>
          <STitle>Inicio de mensualidades</STitle>
          <select value={params.opcionMensualidad} onChange={e=>upd("opcionMensualidad",e.target.value)}>
            <option value="junto_segundo">Junto con el 2º pago de enganche</option>
            <option value="despues_ultimo">Al mes siguiente del último pago de enganche</option>
          </select>
        </div>
      )}

      {tab==="gastos"&&(
        <GastosPanel params={params} setParams={setParams} nBloques={nBloques}/>
      )}

      {tab==="utilidades"&&(
        <div style={{display:"grid",gap:14}}>
          <STitle color={G.gold}>Distribución de utilidades</STitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div>
              <Label>Reserva mínima (meses de gastos)</Label>
              <SmallNum value={params.reservaMinima} onChange={v=>upd("reservaMinima",v)} min={0} max={24}/>
            </div>
            <div>
              <Label>Multiplicador base (% del excedente)</Label>
              <PctInput value={params.utilBaseMultiplier*100} onChange={v=>upd("utilBaseMultiplier",v/100)}/>
            </div>
            <div>
              <Label>Factor crecimiento mensual (×)</Label>
              <SmallNum value={params.utilGrowthRate} onChange={v=>upd("utilGrowthRate",Math.max(1,v))} min={1} max={2} step={0.01}/>
            </div>
          </div>
          <STitle color={G.red}>Morosidad y Cancelaciones</STitle>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div>
              <Label>% Efectividad cobro mensualidades</Label>
              <PctInput value={params.efectividadCobro} onChange={v=>upd("efectividadCobro",clamp(v,1,100))}/>
              <div style={{fontSize:9,color:G.textMuted,marginTop:4}}>Morosidad mensual: {fmt(100-(params.efectividadCobro||85),1)}%</div>
            </div>
            <div>
              <Label>Mes inicio cancelaciones</Label>
              <SmallNum value={params.mesCancelacionInicio} onChange={v=>upd("mesCancelacionInicio",Math.max(1,v))} min={1} max={120}/>
            </div>
            <div>
              <Label>Cancelaciones por mes (lotes)</Label>
              <SmallNum value={params.cancelacionesPorMes} onChange={v=>upd("cancelacionesPorMes",Math.max(0,v))} min={0} max={50}/>
              <div style={{fontSize:9,color:G.textMuted,marginTop:4}}>Lotes cancelados vuelven al inventario</div>
            </div>
          </div>
          <div style={{padding:10,background:G.redDim,borderRadius:7,border:`1px solid ${G.red}20`,fontSize:11,color:G.textDim,lineHeight:1.7}}>
            <strong style={{color:G.red}}>Modelo:</strong> desde mes {params.mesCancelacionInicio}, {params.cancelacionesPorMes} lote(s)/mes cancelan.
            Se pierde el flujo de mensualidades futuras, pero el lote vuelve al inventario y se revende al precio vigente del cluster.
          </div>
          <div style={{padding:12,background:G.goldDim,borderRadius:8,border:`1px solid ${G.gold}30`}}>
            <div style={{fontSize:11,color:G.gold,fontWeight:700,marginBottom:5}}>📌 Distribución de utilidades</div>
            <div style={{fontSize:11,color:G.textDim,lineHeight:1.8}}>
              <strong>Inicio:</strong> saldo &gt; reserva mínima Y mes &gt; 50% del periodo de ventas<br/>
              <strong>Base:</strong> excedente × {pct(params.utilBaseMultiplier*100)} · <strong>Crecimiento:</strong> ×{params.utilGrowthRate}/mes
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VISTA DE ESCENARIO ───────────────────────────────────────────────────────
function ScenarioView({label,color,params,ventasMes,onChangeVentas,result}){
  const [tab,setTab]=useState("resumen");
  const [clusterVista,setClusterVista]=useState(0);
  const [chartExpanded,setChartExpanded]=useState(false);
  if(!result) return <Card><div style={{color:G.textMuted,textAlign:"center",padding:40}}>Calculando…</div></Card>;

  const totalEnganche     = result.flujoMensual.reduce((a,f)=>a+f.engancheMes,0);
  const totalMensualidades= result.flujoMensual.reduce((a,f)=>a+f.mensualidadesMes,0);
  const totalIngresos     = totalEnganche+totalMensualidades||1;
  const utilidadBruta     = result.valorTotalProyecto-result.totalGastosBase-result.totalComisiones;
  const margen            = (utilidadBruta/result.valorTotalProyecto)*100;
  const utilDistribuida   = result.flujoMensual.reduce((a,f)=>a+f.utilidadMes,0);

  const TABS=[{id:"resumen",label:"Resumen"},{id:"flujo",label:"Flujo Mensual"},{id:"precios",label:"Precios × Cluster"}];

  return(
    <Card style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:color,boxShadow:`0 0 8px ${color}`}}/>
          <span style={{fontSize:15,fontWeight:700}}>{label}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,color:G.textMuted}}>Ventas/mes:</span>
          <SmallNum value={ventasMes} onChange={onChangeVentas} min={1} max={500}/>
        </div>
      </div>

      {/* KPIs fila 1 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        <div style={{padding:"9px 11px",background:G.accentDim,borderRadius:8}}>
          <Stat label="Lotes totales" value={fmt(result.totalLotes,0)} color={G.accent} size={16}/>
        </div>
        <div style={{padding:"9px 11px",background:`${color}15`,borderRadius:8}}>
          <Stat label="Valor proyecto" value={fmtMM(result.valorTotalProyecto)} color={color} size={14}/>
        </div>
        <div style={{padding:"9px 11px",background:G.redDim,borderRadius:8}}>
          <Stat label="Costos totales" value={fmtMM(result.totalGastosBase+result.totalComisiones)} color={G.red} size={14}/>
        </div>
        <div style={{padding:"9px 11px",background:G.goldDim,borderRadius:8}}>
          <Stat label={`Utilidad (${pct(margen)})`} value={fmtMM(utilidadBruta)} color={G.gold} size={13}/>
        </div>
      </div>

      {/* KPIs hitos temporales */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        <div style={{padding:"8px 11px",background:G.accentDim,borderRadius:8,border:`1px solid ${G.accent}30`}}>
          <div style={{fontSize:9,color:G.textMuted,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginBottom:4}}>Fin de Ventas</div>
          <div className="mono" style={{fontSize:15,color:G.accent,fontWeight:600}}>Mes {result.mesFinVentas}</div>
          <div style={{fontSize:9,color:G.textMuted}}>{result.mesesVenta} meses de venta</div>
        </div>
        <div style={{padding:"8px 11px",background:G.purpleDim,borderRadius:8,border:`1px solid ${G.purple}30`}}>
          <div style={{fontSize:9,color:G.textMuted,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginBottom:4}}>Fin de Cobros</div>
          <div className="mono" style={{fontSize:15,color:G.purple,fontWeight:600}}>Mes {result.mesFinCobros}</div>
          <div style={{fontSize:9,color:G.textMuted}}>Cierre total del proyecto</div>
        </div>
        <div style={{padding:"8px 11px",background:G.accentDim,borderRadius:8}}>
          <div style={{fontSize:9,color:G.textMuted,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginBottom:4}}>Enganche (total)</div>
          <div className="mono" style={{fontSize:14,color:G.accent,fontWeight:600}}>{fmtMM(totalEnganche)}</div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
            <div style={{flex:1,height:3,background:G.border,borderRadius:2}}>
              <div style={{width:`${(totalEnganche/totalIngresos)*100}%`,height:"100%",background:G.accent,borderRadius:2}}/>
            </div>
            <span className="mono" style={{fontSize:9,color:G.textMuted}}>{pct((totalEnganche/totalIngresos)*100)}</span>
          </div>
        </div>
        <div style={{padding:"8px 11px",background:G.purpleDim,borderRadius:8}}>
          <div style={{fontSize:9,color:G.textMuted,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginBottom:4}}>Mensualidades (total)</div>
          <div className="mono" style={{fontSize:14,color:G.purple,fontWeight:600}}>{fmtMM(totalMensualidades)}</div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
            <div style={{flex:1,height:3,background:G.border,borderRadius:2}}>
              <div style={{width:`${(totalMensualidades/totalIngresos)*100}%`,height:"100%",background:G.purple,borderRadius:2}}/>
            </div>
            <span className="mono" style={{fontSize:9,color:G.textMuted}}>{pct((totalMensualidades/totalIngresos)*100)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{borderBottom:`1px solid ${G.border}`,display:"flex",gap:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={tab===t.id?"tab-on":""}
            style={{padding:"7px 13px",background:"transparent",border:"none",
              borderBottom:"2px solid transparent",color:G.textMuted,fontSize:10,fontWeight:600}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==="resumen"&&(
        <div style={{display:"grid",gap:14}}>
          {/* Gráfica */}
          <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:9,color:G.textMuted,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>
                      Flujo del proyecto — Ingresos · Gastos · Utilidades
                    </span>
                    <button onClick={()=>setChartExpanded(true)} style={{
                      padding:"4px 10px",borderRadius:5,border:`1px solid ${G.accent}`,
                      background:G.accentDim,color:G.accent,fontSize:10,fontWeight:700,
                      letterSpacing:".05em",display:"flex",alignItems:"center",gap:5,
                    }}>⤢ Expandir</button>
                  </div>
                  <FlowChart flujo={result.flujoMensual} partidas={params.partidas}
                    mesFinVentas={result.mesFinVentas} mesFinCobros={result.mesFinCobros}
                    mesInicioUtil={result.mesInicioUtil} mesFinObra={result.mesesVenta}/>
                </div>
                {chartExpanded&&(
                  <div style={{
                    position:"fixed",inset:0,zIndex:9999,background:"rgba(10,14,26,0.97)",
                    display:"flex",flexDirection:"column",
                  }}>
                    <div style={{padding:"12px 20px",borderBottom:`1px solid ${G.border}`,
                      display:"flex",justifyContent:"space-between",alignItems:"center",
                      background:G.surface,flexShrink:0}}>
                      <div>
                        <span style={{fontSize:13,fontWeight:700,color:G.text}}>{label}</span>
                        <span style={{fontSize:10,color:G.textMuted,marginLeft:12}}>
                          {result.totalLotes} lotes · {result.mesesVenta} meses de venta
                        </span>
                      </div>
                      <button onClick={()=>setChartExpanded(false)} style={{
                        padding:"6px 14px",borderRadius:6,border:`1px solid ${G.red}`,
                        background:G.redDim,color:G.red,fontSize:11,fontWeight:700,
                      }}>✕ Cerrar</button>
                    </div>
                    <div style={{flex:1,overflow:"auto",padding:"20px 24px",background:G.bg}}>
                      <FlowChart flujo={result.flujoMensual} partidas={params.partidas}
                        mesFinVentas={result.mesFinVentas} mesFinCobros={result.mesFinCobros}
                        mesInicioUtil={result.mesInicioUtil} mesFinObra={result.mesesVenta}
                        expanded={true}/>
                    </div>
                    <div style={{padding:"10px 20px",borderTop:`1px solid ${G.border}`,
                      background:G.surface,display:"flex",gap:20,flexShrink:0,flexWrap:"wrap"}}>
                      {[
                        {c:G.accent,l:"Fin ventas",v:`Mes ${result.mesFinVentas}`},
                        {c:G.blue,l:"Fin obra",v:`Mes ${result.mesesVenta}`},
                        result.mesInicioUtil?{c:G.gold,l:"Ini. utilidades",v:`Mes ${result.mesInicioUtil}`}:null,
                        {c:G.purple,l:"Fin cobros",v:`Mes ${result.mesFinCobros}`},
                      ].filter(Boolean).map(({c,l,v})=>(
                        <div key={l} style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:12,height:3,background:c,borderRadius:2}}/>
                          <span style={{fontSize:10,color:G.textMuted}}>{l}:</span>
                          <span className="mono" style={{fontSize:11,color:c,fontWeight:700}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

          {/* Desglose costos con % */}
          <div>
            <div style={{fontSize:9,color:G.textMuted,fontWeight:700,marginBottom:8,letterSpacing:".06em",textTransform:"uppercase"}}>
              Desglose costos — monto y % sobre ingresos totales
            </div>
            {params.partidas.map(pt=>(
              <div key={pt.id} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:12,
                alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${G.border}15`}}>
                <span style={{fontSize:10,color:G.textDim}}>{pt.label}</span>
                <span className="mono" style={{fontSize:10,color:pt.color}}>{fmtMM(pt.total)}</span>
                <span className="mono" style={{fontSize:9,color:G.textMuted}}>{pct((pt.total/totalIngresos)*100)}</span>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:12,
              padding:"5px 0 0",borderTop:`1px solid ${G.border}`,marginTop:4}}>
              <span style={{fontSize:11,fontWeight:700}}>Comisiones (est.)</span>
              <span className="mono" style={{fontSize:11,color:G.red}}>{fmtMM(result.totalComisiones)}</span>
              <span className="mono" style={{fontSize:9,color:G.textMuted}}>{pct((result.totalComisiones/totalIngresos)*100)}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:12,padding:"4px 0 0"}}>
              <span style={{fontSize:12,fontWeight:700}}>Total Costos</span>
              <span className="mono" style={{fontSize:12,color:G.red,fontWeight:700}}>{fmtMM(result.totalGastosBase+result.totalComisiones)}</span>
              <span className="mono" style={{fontSize:10,color:G.red}}>{pct(((result.totalGastosBase+result.totalComisiones)/totalIngresos)*100)}</span>
            </div>

            {/* Utilidades distribuidas */}
            <div style={{marginTop:10,padding:"8px 12px",background:G.goldDim,borderRadius:7,
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,color:G.gold,fontWeight:700}}>💰 Inicio distribución: Mes {result.mesInicioUtil||"—"}</span>
              <span className="mono" style={{fontSize:11,color:G.gold}}>Proyectado: {fmtMM(utilDistribuida)}</span>
            </div>
          </div>
        </div>
      )}

      {tab==="flujo"&&(
        <div style={{display:"grid",gap:14,padding:"8px 0"}}>
          {/* Resumen rápido de totales */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {/* Alerta de obra */}
            {result.flujoMensual.some(f=>f.alertaObra)&&(
              <div style={{gridColumn:"1/-1",padding:"10px 14px",background:G.redDim,borderRadius:8,
                border:`1px solid ${G.red}40`,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:16}}>⚠️</span>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:G.red}}>Alerta: flujo insuficiente para cubrir urbanización</div>
                  <div style={{fontSize:10,color:G.textDim,marginTop:2}}>
                    En {result.flujoMensual.filter(f=>f.alertaObra).length} mes(es) el saldo disponible no alcanza para el gasto de urbanización proyectado.
                    Primeros meses críticos: {result.flujoMensual.filter(f=>f.alertaObra).slice(0,3).map(f=>`Mes ${f.mes}`).join(", ")}.
                  </div>
                </div>
              </div>
            )}
            {[
              {label:"Total ingresos",val:fmtMM(result.flujoMensual.reduce((a,f)=>a+f.ingresosBrutos,0)),color:G.accent},
              {label:"Total gastos",val:fmtMM(result.flujoMensual.reduce((a,f)=>a+f.totalGastosMes,0)),color:G.red},
              {label:"Utilidades distribuidas",val:fmtMM(result.flujoMensual.reduce((a,f)=>a+f.utilidadMes,0)),color:G.gold},
              {label:"Saldo final",val:fmtMM(result.flujoMensual[result.flujoMensual.length-1]?.saldo||0),color:G.blue},
              {label:"Cancelaciones totales",val:fmt(result.flujoMensual.reduce((a,f)=>a+(f.cancelMes||0),0),0)+" lotes",color:G.red},
              {label:"Mes saldo máximo",val:"Mes "+(result.flujoMensual.reduce((mx,f)=>f.saldo>mx.saldo?f:mx,result.flujoMensual[0])?.mes||0),color:G.textDim},
            ].map(({label,val,color})=>(
              <div key={label} style={{padding:"10px 12px",background:G.surfaceLight,borderRadius:8}}>
                <div style={{fontSize:9,color:G.textMuted,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
                <div className="mono" style={{fontSize:14,color,fontWeight:600}}>{val}</div>
              </div>
            ))}
          </div>

          {/* Botón exportar */}
          <div style={{padding:20,background:G.accentDim,borderRadius:10,border:`1px solid ${G.accent}30`,
            display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:G.accent,marginBottom:4}}>Exportar flujo completo a Excel / CSV</div>
              <div style={{fontSize:11,color:G.textMuted,lineHeight:1.6}}>
                Descarga todas las {result.flujoMensual.length} filas del flujo mensual con columnas de monto mensual,
                acumulado y % del presupuesto por cada partida. Incluye hoja de resumen con KPIs,
                precios por cluster y tabla cluster × plazo.
              </div>
            </div>
            <button
              onClick={()=>exportarExcel(result.flujoMensual, params.partidas, params, label, result)}
              style={{
                padding:"12px 24px",borderRadius:8,border:`1px solid ${G.accent}`,
                background:G.accent,color:G.bg,fontSize:12,fontWeight:700,
                letterSpacing:".05em",whiteSpace:"nowrap",flexShrink:0,
              }}>
              ↓ Descargar CSV
            </button>
          </div>

          {/* Nota */}
          <div style={{fontSize:11,color:G.textMuted,padding:"8px 12px",background:G.surfaceLight,borderRadius:6}}>
            💡 Abre el archivo en <strong style={{color:G.text}}>Excel</strong> o <strong style={{color:G.text}}>Google Sheets</strong> para filtrar, ordenar y analizar el flujo completo del proyecto.
            El CSV incluye dos secciones: flujo mensual detallado y resumen del proyecto.
          </div>
        </div>
      )}

      {tab==="precios"&&(
        <div style={{display:"grid",gap:14}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {result.precioCluster.map((pc,i)=>(
              <button key={i} onClick={()=>setClusterVista(i)} style={{
                padding:"5px 12px",borderRadius:6,fontSize:10,fontWeight:700,
                border:`1px solid ${clusterVista===i?color:G.border}`,
                background:clusterVista===i?`${color}20`:"transparent",
                color:clusterVista===i?color:G.textMuted,
              }}>C{i+1} · {fmtM(pc)}/m²</button>
            ))}
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>
              <thead>
                <tr>
                  <th style={{padding:"6px 10px",background:G.surfaceLight,color:G.textMuted,fontSize:9,textAlign:"left",letterSpacing:".06em",textTransform:"uppercase"}}>Plazo</th>
                  <th style={{padding:"6px 10px",background:G.surfaceLight,color:G.textMuted,fontSize:9,textAlign:"right"}}>Delta</th>
                  <th style={{padding:"6px 10px",background:G.surfaceLight,color,fontSize:9,textAlign:"right"}}>Precio m²</th>
                  <th style={{padding:"6px 10px",background:G.surfaceLight,color:G.text,fontSize:9,textAlign:"right"}}>Total lote</th>
                  <th style={{padding:"6px 10px",background:G.surfaceLight,color:G.accent,fontSize:9,textAlign:"right"}}>Enganche</th>
                  <th style={{padding:"6px 10px",background:G.surfaceLight,color:G.purple,fontSize:9,textAlign:"right"}}>Mensualidad</th>
                  <th style={{padding:"6px 10px",background:G.surfaceLight,color:G.gold,fontSize:9,textAlign:"right"}}>Lotes est.</th>
                </tr>
              </thead>
              <tbody>
                {result.plazos.map((pl,pi)=>{
                  const pc=result.precioCluster[clusterVista]||0;
                  const precM2=pc*pl.factor;
                  const total=precM2*result.m2PorLote;
                  const eng=total*(params.pctEnganche/100);
                  const mens=pl.meses>0?(total-eng)/pl.meses:0;
                  const isBase=pl.meses===params.plazoBase;
                  // Lotes estimados vendidos con este plazo en este cluster
                  const lotesCluster=Math.round(result.totalResid/params.numClusters);
                  const lotesEst=Math.round(lotesCluster*(pl.pct/100));
                  return(
                    <tr key={pi} style={{background:isBase?G.goldDim:pi%2===0?`${G.surfaceLight}40`:"transparent"}}>
                      <td style={{padding:"6px 10px",color:isBase?G.gold:G.textDim,fontWeight:isBase?700:400}}>{pl.label}{isBase?" ★":""}</td>
                      <td style={{padding:"6px 10px",textAlign:"right",color:pl.delta>0?G.accent:pl.delta<0?G.red:G.textMuted}}>{pl.delta>0?"+":""}{pl.delta}%</td>
                      <td style={{padding:"6px 10px",textAlign:"right",color,fontWeight:600}}>{fmtM(precM2)}</td>
                      <td style={{padding:"6px 10px",textAlign:"right",color:G.text}}>{fmtMM(total)}</td>
                      <td style={{padding:"6px 10px",textAlign:"right",color:G.accent}}>{fmtMM(eng)}</td>
                      <td style={{padding:"6px 10px",textAlign:"right",color:pl.meses>0?G.purple:G.textMuted}}>{pl.meses>0?fmtMM(mens):"CONTADO"}</td>
                      <td style={{padding:"6px 10px",textAlign:"right",color:G.gold,fontWeight:600}}>{lotesEst}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function AmarahII(){
  const [params,setParams]=useState(DEF);
  const [ventasEsc1,setVentasEsc1]=useState(15);
  const [ventasEsc2,setVentasEsc2]=useState(8);
  const [showParams,setShowParams]=useState(true);
  const fileRef=useRef();

  // Debounced engine — evita recálculos en cada keystroke (previene congelamiento)
  const [dParams,setDParams]=useState(params);
  const [dV1,setDV1]=useState(ventasEsc1);
  const [dV2,setDV2]=useState(ventasEsc2);
  const debRef=useRef(null);
  useEffect(()=>{
    if(debRef.current) clearTimeout(debRef.current);
    debRef.current=setTimeout(()=>{
      setDParams(params); setDV1(ventasEsc1); setDV2(ventasEsc2);
    },450);
    return()=>{if(debRef.current)clearTimeout(debRef.current);};
  },[params,ventasEsc1,ventasEsc2]);
  const result1=useMemo(()=>{try{return calcEngine(dParams,dV1);}catch(e){console.error(e);return null;}},[dParams,dV1]);
  const result2=useMemo(()=>{try{return calcEngine(dParams,dV2);}catch(e){console.error(e);return null;}},[dParams,dV2]);

  const nBloques=result1?.nBloques||8;

  const exportCfg=()=>{
    const blob=new Blob([JSON.stringify({params,ventasEsc1,ventasEsc2},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="amarah2_config.json";a.click();URL.revokeObjectURL(url);
  };
  const importCfg=(e)=>{
    const file=e.target.files[0];if(!file)return;
    const r=new FileReader();
    r.onload=(ev)=>{try{const d=JSON.parse(ev.target.result);if(d.params)setParams(d.params);if(d.ventasEsc1)setVentasEsc1(d.ventasEsc1);if(d.ventasEsc2)setVentasEsc2(d.ventasEsc2);}catch{alert("Archivo inválido");}};
    r.readAsText(file);
  };

  return(
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh",background:G.bg}}>
        <div style={{padding:"15px 22px",borderBottom:`1px solid ${G.border}`,
          display:"flex",justifyContent:"space-between",alignItems:"center",
          background:G.surface,position:"sticky",top:0,zIndex:100}}>
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:12}}>
              <span style={{fontSize:19,fontWeight:800,letterSpacing:"-.02em"}}>AMARAH II</span>
              <span style={{fontSize:11,color:G.accent,fontWeight:600,letterSpacing:".1em"}}>PROYECCIÓN DE FLUJOS</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:1}}>
              <span style={{fontSize:10,color:G.textMuted}}>Grupo Ureca · Dzilam González, Yucatán</span>
              {(JSON.stringify(params)!==JSON.stringify(dParams)||ventasEsc1!==dV1||ventasEsc2!==dV2)&&(
                <span style={{fontSize:9,color:G.gold,fontFamily:"'IBM Plex Mono',monospace",
                  animation:"pulse 1s infinite",padding:"1px 7px",borderRadius:4,
                  background:G.goldDim,border:`1px solid ${G.gold}30`}}>
                  ⟳ calculando…
                </span>
              )}
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button style={btnS(G.textMuted)} onClick={()=>setShowParams(v=>!v)}>
              {showParams?"▲ Ocultar":"▼ Parámetros"}
            </button>
            <button style={btnS(G.accent)} onClick={exportCfg}>↓ Exportar config</button>
            <button style={btnS(G.blue)} onClick={()=>fileRef.current.click()}>↑ Importar config</button>
            <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={importCfg}/>
          </div>
        </div>

        <div style={{padding:"20px 22px",display:"grid",gap:20}}>
          {showParams&&(
            <Card>
              <div style={{fontSize:11,fontWeight:700,color:G.accent,letterSpacing:".08em",
                textTransform:"uppercase",marginBottom:14}}>⚙ Parámetros del Proyecto</div>
              <ParamPanel params={params} setParams={setParams} result={result1}/>
            </Card>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
            <ScenarioView label="Escenario A — Optimista" color={G.accent}
              params={params} ventasMes={ventasEsc1} onChangeVentas={setVentasEsc1} result={result1}/>
            <ScenarioView label="Escenario B — Conservador" color={G.blue}
              params={params} ventasMes={ventasEsc2} onChangeVentas={setVentasEsc2} result={result2}/>
          </div>

          {result1&&result2&&(
            <Card>
              <div style={{fontSize:10,fontWeight:700,color:G.textDim,letterSpacing:".08em",
                textTransform:"uppercase",marginBottom:14}}>⇄ Comparativa de Escenarios</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    {["Métrica","Escenario A","Escenario B","Δ"].map((h,i)=>(
                      <th key={h} style={{padding:"6px 12px",fontSize:9,fontWeight:700,letterSpacing:".06em",
                        textTransform:"uppercase",color:G.textMuted,background:G.surfaceLight,
                        textAlign:i===0?"left":"right"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[
                      ["Meses de venta",`${result1.mesesVenta} m`,`${result2.mesesVenta} m`,`+${result2.mesesVenta-result1.mesesVenta} m`],
                      ["Fin de ventas (mes)",`Mes ${result1.mesFinVentas}`,`Mes ${result2.mesFinVentas}`,`Δ${result2.mesFinVentas-result1.mesFinVentas}`],
                      ["Fin de cobros (mes)",`Mes ${result1.mesFinCobros}`,`Mes ${result2.mesFinCobros}`,`Δ${result2.mesFinCobros-result1.mesFinCobros}`],
                      ["Valor total proyecto",fmtMM(result1.valorTotalProyecto),fmtMM(result2.valorTotalProyecto),"—"],
                      ["Ingresos por enganche",fmtMM(result1.flujoMensual.reduce((a,f)=>a+f.engancheMes,0)),fmtMM(result2.flujoMensual.reduce((a,f)=>a+f.engancheMes,0)),"—"],
                      ["Ingresos mensualidades",fmtMM(result1.flujoMensual.reduce((a,f)=>a+f.mensualidadesMes,0)),fmtMM(result2.flujoMensual.reduce((a,f)=>a+f.mensualidadesMes,0)),"—"],
                      ["Costos totales",fmtMM(result1.totalGastosBase+result1.totalComisiones),fmtMM(result2.totalGastosBase+result2.totalComisiones),"—"],
                      ["Utilidad bruta",fmtMM(result1.valorTotalProyecto-result1.totalGastosBase-result1.totalComisiones),fmtMM(result2.valorTotalProyecto-result2.totalGastosBase-result2.totalComisiones),"—"],
                      ["Inicio distribución util.",result1.mesInicioUtil?`Mes ${result1.mesInicioUtil}`:"—",result2.mesInicioUtil?`Mes ${result2.mesInicioUtil}`:"—","—"],
                    ].map((row,ri)=>(
                      <tr key={ri} style={{background:ri%2===0?`${G.surfaceLight}50`:"transparent"}}>
                        {row.map((cell,ci)=>(
                          <td key={ci} style={{padding:"6px 12px",fontSize:11,
                            fontFamily:ci===0?"'Syne',sans-serif":"'IBM Plex Mono',monospace",
                            color:ci===0?G.textDim:ci===1?G.accent:ci===2?G.blue:G.gold,
                            textAlign:ci===0?"left":"right",borderBottom:`1px solid ${G.border}20`}}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
