import{a as e}from"./rolldown-runtime-CNC7AqOf.js";import{c as t,d as n,g as r,h as i,i as a,l as o,v as s}from"./index-C6gWeAGi.js";import{t as c}from"./AppShell-D-9zFuq-.js";import{i as l}from"./reportData-BcBlX8pR.js";var u=e(s(),1),d=r();function f(e){if(e==null||Number.isNaN(e))return`—`;let t=e>1?e/100:e;return`${t>=.8?`Tinggi`:t>=.6?`Sedang`:`Rendah`} (${t.toFixed(2)})`}function p(e){if(!e)return`—`;let t=new Date(e);return Number.isNaN(t.getTime())?`—`:`${t.toLocaleString(`id-ID`,{day:`2-digit`,month:`short`,hour:`2-digit`,minute:`2-digit`,timeZone:`Asia/Jakarta`})} WIB`}function m(e,t){return(t?[e.region?.village,e.region?.district,e.region?.regency]:[e.region?.village,e.region?.district]).filter(Boolean).join(`, `)||`Wilayah pesisir`}function h(e){return`${new Date(e.incident_time).toLocaleTimeString(`id-ID`,{hour:`2-digit`,minute:`2-digit`,timeZone:`Asia/Jakarta`})} WIB`}var g={hidden:{opacity:0},show:{opacity:1,transition:{staggerChildren:.1,ease:`easeOut`}}},_={hidden:{opacity:0,y:15},show:{opacity:1,y:0,transition:{type:`spring`,stiffness:300,damping:24}}};function v({error:e,marginBottom:t}){return e?(0,d.jsxs)(o.div,{initial:{opacity:0,y:-10},animate:{opacity:1,y:0},className:`alert`,style:{marginBottom:t,borderLeftColor:`var(--critical)`},children:[(0,d.jsx)(i,{name:`error`,style:{color:`var(--critical)`}}),` `,e]}):null}function y({data:e,compact:t}){return e?.status_label?(0,d.jsxs)(`span`,{className:`citizen-status-badge`,"data-compact":t?``:void 0,children:[(0,d.jsx)(i,{name:e.is_monitored?`radar`:`info`,style:{fontSize:t?14:16}}),` `,e.status_label]}):null}function b({data:e,tone:t}){return e?.prediction_notice?(0,d.jsxs)(`div`,{className:`citizen-prediction-notice ${t}`,children:[(0,d.jsx)(i,{name:e.prediction_status===`unavailable`?`schedule`:`update`,style:{fontSize:t===`frost`?16:17,flexShrink:0,marginTop:1}}),(0,d.jsx)(`span`,{children:e.prediction_notice})]}):null}function x({data:e,dataLoaded:t,compact:n}){let r=e?e.guidance_message??`Pantau kondisi rob di sekitar Anda dan ikuti arahan BPBD.`:t?n?`Lokasi di luar wilayah pantauan Lampung. Pilih lokasi dari daftar.`:`Lokasi Anda berada di luar wilayah pantauan Lampung. Pilih lokasi lain dari daftar di atas untuk melihat status bahaya rob.`:n?`Menganalisis status rob...`:`Menganalisis status ancaman rob terbaru di sekitar Anda...`;return(0,d.jsx)(`p`,{className:n?`citizen-guidance compact`:`citizen-guidance`,children:r})}function S({day:e,label:t,percent:n,color:r,index:i,className:a,compact:s}){return(0,d.jsxs)(o.div,{className:a,whileHover:s?void 0:{y:-5},style:{textAlign:`center`,display:`flex`,flexDirection:`column`,alignItems:`center`},children:[(0,d.jsx)(`div`,{style:s?{fontSize:12,color:`var(--ink-soft)`,fontWeight:700,marginBottom:12}:{fontSize:13,color:`var(--ink-soft)`,fontWeight:600,marginBottom:12},children:e}),(0,d.jsx)(`div`,{style:s?{height:100,width:14,borderRadius:999,background:`var(--line)`,position:`relative`,margin:`0 auto 12px auto`}:{height:120,width:12,borderRadius:999,background:`var(--line)`,position:`relative`,margin:`8px 0`},children:(0,d.jsx)(o.div,{initial:{height:0},animate:{height:`${Math.min(n,100)}%`},transition:{delay:(s?.3:.5)+i*(s?.1:.05),duration:.8,type:`spring`},style:{position:`absolute`,bottom:0,left:0,width:`100%`,background:r,borderRadius:999}})}),(0,d.jsx)(`div`,{style:{fontSize:12,fontWeight:800,color:r,marginTop:s?0:12},children:t}),(0,d.jsxs)(`div`,{style:s?{fontSize:12,color:`var(--ink-soft)`,marginTop:2}:{fontSize:13,color:`var(--ink-soft)`,marginTop:4},children:[n,`%`]})]})}function C({card:e,variant:t}){let[n,r,a]=e,s=n===`Laporkan kejadian`,c=t===`mobile`;return(0,d.jsxs)(o.div,{className:c?`mobile-action-card`:`citizen-action-card`,whileHover:c?void 0:{x:4},onClick:()=>{s&&(window.location.hash=`#/reports`)},style:{cursor:s?`pointer`:`default`,...c?{border:s?`1px solid var(--accent-blue)`:void 0}:{borderRadius:8,display:`flex`,gap:16,alignItems:`flex-start`}},children:[(0,d.jsx)(`div`,{style:c?{width:40,height:40,borderRadius:12,display:`flex`,alignItems:`center`,justifyContent:`center`,background:s?`rgba(37,99,235,0.1)`:`var(--surface-soft)`,color:s?`var(--accent-blue)`:`var(--ink-soft)`}:{width:48,height:48,borderRadius:14,display:`flex`,alignItems:`center`,justifyContent:`center`,background:`var(--surface-soft)`,color:s?`var(--accent-blue)`:`var(--ink-soft)`,flexShrink:0},children:(0,d.jsx)(i,{name:a,style:{fontSize:c?20:24}})}),(0,d.jsxs)(`div`,{style:c?{}:{paddingTop:2},children:[(0,d.jsx)(`strong`,{style:c?{display:`block`,fontSize:`13px`,lineHeight:1.3,marginBottom:4,color:s?`var(--accent-blue)`:`var(--ink-primary)`}:{display:`block`,marginBottom:6,fontSize:`15px`,color:s?`var(--accent-blue)`:`var(--ink-primary)`},children:n}),(0,d.jsx)(`p`,{style:c?{margin:0,fontSize:`12px`,color:`var(--ink-soft)`,lineHeight:1.4,display:`-webkit-box`,WebkitLineClamp:2,WebkitBoxOrient:`vertical`,overflow:`hidden`}:{margin:0,fontSize:`14px`,color:`var(--ink-soft)`,lineHeight:1.6},children:r})]})]})}function w({report:e,dense:t}){return(0,d.jsx)(`span`,{className:`badge severity-${e.severity}`,style:t?{padding:`4px 8px`,fontSize:11}:void 0,children:e.water_height_cm?`${e.water_height_cm} cm`:l[e.severity]})}function T({label:e,dense:t}){return(0,d.jsxs)(`span`,{className:`badge status-divalidasi`,style:t?{padding:`4px 8px`,fontSize:11}:void 0,children:[(0,d.jsx)(i,{name:`verified`,style:{fontSize:t?12:14}}),` `,e]})}function E({onWhatsApp:e,onCopy:t,compact:n}){let r=n?{width:`100%`,justifyContent:`center`,fontSize:`13.5px`,padding:`12px`,gap:8}:{width:`100%`,justifyContent:`center`,fontSize:`14px`};return(0,d.jsxs)(`div`,{className:n?`citizen-share-actions compact`:`citizen-share-actions`,children:[(0,d.jsxs)(`button`,{className:`btn primary`,type:`button`,onClick:e,style:{background:`#16a34a`,borderColor:`#16a34a`,...r},children:[(0,d.jsx)(i,{name:`share`,style:n?{fontSize:18}:void 0}),` Bagikan via WhatsApp`]}),(0,d.jsxs)(`button`,{className:`btn secondary`,type:`button`,onClick:t,style:r,children:[(0,d.jsx)(i,{name:`content_copy`,style:n?{fontSize:18}:void 0}),` Salin Teks Peringatan`]})]})}function D({data:e}){return(0,d.jsxs)(o.section,{variants:_,className:`panel`,style:{background:`var(--surface-soft)`,border:`none`},children:[(0,d.jsx)(`h2`,{style:{fontSize:`1.05rem`,margin:`0 0 16px 0`},children:`Informasi Teknis Model`}),(0,d.jsxs)(`div`,{style:{display:`grid`,gap:10,fontSize:13,color:`var(--ink-soft)`,lineHeight:1.5},children:[(0,d.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,gap:12},children:[(0,d.jsx)(`span`,{children:`Model AI`}),` `,(0,d.jsx)(`strong`,{style:{textAlign:`right`},children:e?.model_version??`—`})]}),(0,d.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,gap:12},children:[(0,d.jsx)(`span`,{children:`Kepercayaan`}),` `,(0,d.jsx)(`strong`,{style:{textAlign:`right`,color:`var(--low)`},children:f(e?.confidence_score)})]}),(0,d.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,gap:12},children:[(0,d.jsx)(`span`,{children:`Sumber Data`}),` `,(0,d.jsx)(`strong`,{style:{textAlign:`right`},children:e?.data_source??`—`})]}),(0,d.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,gap:12},children:[(0,d.jsx)(`span`,{children:`Pembaruan`}),` `,(0,d.jsx)(`strong`,{style:{textAlign:`right`},children:p(e?.generated_at)})]})]})]})}var O=`
  .citizen-status-badge {
    align-items: center;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 999px;
    display: inline-flex;
    font-size: 13px;
    font-weight: 650;
    gap: 6px;
    margin-bottom: 16px;
    padding: 5px 12px;
  }
  .citizen-status-badge[data-compact] { font-size: 12px; margin-bottom: 12px; padding: 4px 10px; }

  .citizen-prediction-notice {
    align-items: flex-start;
    background: rgba(245, 158, 11, 0.18);
    border: 1px solid rgba(245, 158, 11, 0.5);
    border-radius: 12px;
    display: flex;
    font-size: 13.5px;
    gap: 8px;
    line-height: 1.5;
    margin-bottom: 16px;
    max-width: 600px;
    padding: 10px 14px;
  }
  .citizen-prediction-notice.frost {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: white;
    font-size: 13px;
    max-width: none;
  }

  .citizen-guidance {
    color: rgba(255, 255, 255, 0.95);
    font-size: 1.15rem;
    line-height: 1.6;
    margin: 0 0 40px 0;
    max-width: 600px;
  }
  .citizen-guidance.compact {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    line-height: 1.5;
    margin: 0 0 24px 0;
    max-width: none;
  }

  .citizen-share-actions.compact { display: flex; flex-direction: column; gap: 10px; }
`,k=new Intl.NumberFormat(`id-ID`,{maximumFractionDigits:2}),A={rendah:`Rendah`,sedang:`Sedang`,tinggi:`Tinggi`,sangat_tinggi:`Sangat Tinggi`},j=e=>{switch(e){case`sangat_tinggi`:return{background:`linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)`,boxShadow:`0 24px 48px rgba(220, 38, 38, 0.3)`,icon:`warning`};case`tinggi`:return{background:`linear-gradient(135deg, #f97316 0%, #c2410c 100%)`,boxShadow:`0 24px 48px rgba(249, 115, 22, 0.3)`,icon:`warning`};case`sedang`:return{background:`linear-gradient(135deg, #eab308 0%, #a16207 100%)`,boxShadow:`0 24px 48px rgba(234, 179, 8, 0.3)`,icon:`warning`};default:return{background:`linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)`,boxShadow:`0 24px 48px rgba(37, 99, 235, 0.25)`,icon:`info`}}};function M(e){let t=[],n=e=>{if(Array.isArray(e)){if(typeof e[0]==`number`&&typeof e[1]==`number`){t.push([e[0],e[1]]);return}e.forEach(n)}};if(n(e),!t.length)return null;let r=t.map(([e])=>e),i=t.map(([,e])=>e);return[(Math.min(...r)+Math.max(...r))/2,(Math.min(...i)+Math.max(...i))/2]}function N({options:e,currentLocation:t,onSelectWilayah:n,onRequestGps:r,variant:a}){let[o,s]=(0,u.useState)(!1),[c,l]=(0,u.useState)(``),f=(0,u.useRef)(null);(0,u.useEffect)(()=>{if(!o)return;let e=e=>{f.current&&!f.current.contains(e.target)&&s(!1)};return document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[o]);let p=c.trim().toLowerCase(),m=(p?e.filter(e=>e.label.toLowerCase().includes(p)):e).slice(0,60);return(0,d.jsxs)(`div`,{className:`wilayah-picker ${a}`,ref:f,children:[(0,d.jsxs)(`button`,{type:`button`,className:`wilayah-trigger`,"aria-haspopup":`listbox`,"aria-expanded":o,onClick:()=>s(e=>!e),children:[(0,d.jsx)(i,{name:`location_on`,style:{fontSize:18,flexShrink:0}}),(0,d.jsx)(`span`,{className:`wilayah-trigger-label`,children:t}),(0,d.jsx)(i,{name:`expand_more`,style:{fontSize:18,flexShrink:0}})]}),o&&(0,d.jsxs)(`div`,{className:`wilayah-popover`,role:`listbox`,children:[(0,d.jsxs)(`div`,{className:`wilayah-search`,children:[(0,d.jsx)(i,{name:`search`,style:{fontSize:18,color:`var(--ink-soft)`}}),(0,d.jsx)(`input`,{autoFocus:!0,value:c,onChange:e=>l(e.target.value),placeholder:`Cari kelurahan atau kabupaten…`,"aria-label":`Cari wilayah`})]}),(0,d.jsxs)(`button`,{type:`button`,className:`wilayah-option gps`,onClick:()=>{r(),s(!1)},children:[(0,d.jsx)(i,{name:`my_location`,style:{fontSize:18}}),` Gunakan lokasi perangkat`]}),(0,d.jsxs)(`div`,{className:`wilayah-list`,children:[m.length===0&&(0,d.jsx)(`div`,{className:`wilayah-empty`,children:`Wilayah tidak ditemukan.`}),m.map(e=>(0,d.jsx)(`button`,{type:`button`,className:`wilayah-option`,onClick:()=>{n(e),s(!1),l(``)},children:e.label},`${e.label}-${e.lat}-${e.lon}`))]})]})]})}var P=`
  .wilayah-picker { position: relative; min-width: 0; }
  .wilayah-picker.hero { max-width: 320px; width: 100%; flex: 1 1 240px; }
  .wilayah-picker.mobile { width: 100%; }
  .wilayah-picker.mobile .wilayah-trigger { background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.28); color: #fff; }
  .wilayah-trigger {
    align-items: center;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--ink);
    cursor: pointer;
    display: flex;
    font-size: 0.9rem;
    font-weight: 600;
    gap: 8px;
    min-height: 42px;
    padding: 8px 12px;
    width: 100%;
  }
  .wilayah-trigger-label { flex: 1; min-width: 0; overflow: hidden; text-align: left; text-overflow: ellipsis; white-space: nowrap; }
  .wilayah-popover {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    left: 0;
    max-height: 340px;
    overflow: hidden;
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 40;
  }
  .wilayah-search { align-items: center; border-bottom: 1px solid var(--line); display: flex; gap: 8px; padding: 10px 12px; }
  .wilayah-search input { border: 0; flex: 1; font-size: 0.9rem; min-height: 0; outline: none; padding: 0; width: 100%; }
  .wilayah-list { max-height: 240px; overflow-y: auto; }
  .wilayah-option {
    background: transparent;
    border: 0;
    color: var(--ink);
    cursor: pointer;
    display: flex;
    font-size: 0.88rem;
    gap: 8px;
    padding: 11px 14px;
    text-align: left;
    width: 100%;
  }
  .wilayah-option:hover { background: var(--surface-soft); }
  .wilayah-option.gps { align-items: center; border-bottom: 1px solid var(--line); color: var(--accent-dark); font-weight: 650; }
  .wilayah-empty { color: var(--ink-soft); font-size: 0.86rem; padding: 16px 14px; text-align: center; }
`;function F(){let[e,t]=(0,u.useState)(window.innerWidth<=768);return(0,u.useEffect)(()=>{let e=()=>t(window.innerWidth<=768);return window.addEventListener(`resize`,e),()=>window.removeEventListener(`resize`,e)},[]),e}function I({data:e,error:t,dataLoaded:n,setCoordinates:r,setLocationNote:s,requestGpsLocation:l,wilayahOptions:u,risk:f,cardStyle:p,forecastDays:A,currentLocation:j,actionCards:M,handleShareWhatsApp:F,handleCopyWarning:I}){return(0,d.jsxs)(c,{active:`awam`,title:`Status Bahaya Saya`,subtitle:`Panduan mitigasi dan peringatan dini disajikan dalam bahasa yang mudah dipahami.`,children:[(0,d.jsx)(`style`,{children:`
        ${P}
        ${O}
        .citizen-mode-layout { grid-template-columns: minmax(0, 1fr) 340px; max-width: 1280px; padding-top: 24px; }
        .citizen-status-card { border-radius: 16px !important; padding: 34px !important; }
        .citizen-location-controls { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; margin-bottom: 28px; }
        .citizen-location-name { align-items: center; display: flex; font-size: .9rem; font-weight: 650; gap: 8px; min-width: 0; flex: 1 1 auto; }
        .citizen-location-name span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .citizen-location-controls select { background: rgba(255,255,255,.96); flex: 0 0 auto; max-width: 300px; }
        .citizen-status-title { font-size: clamp(2.4rem, 5vw, 3.5rem) !important; }
        .citizen-status-metrics { border-top: 1px solid rgba(255,255,255,.22); display: grid; gap: 12px; grid-template-columns: repeat(3,minmax(0,1fr)); margin-top: 30px; padding-top: 22px; }
        .citizen-status-metric { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); border-radius: 12px; min-width: 0; padding: 16px; }
        .citizen-forecast-grid { display: grid; gap: 10px; grid-template-columns: repeat(7,minmax(84px,1fr)); overflow-x: auto; padding: 24px; -ms-overflow-style: none; scrollbar-width: none; }
        .citizen-forecast-grid::-webkit-scrollbar { display: none; }
        .citizen-forecast-day { background: var(--surface-soft); border: 1px solid var(--line); border-radius: 12px; padding: 14px 8px; }
        .citizen-recommendations { display: grid; gap: 10px !important; }
        .citizen-action-card { background: var(--surface-soft); border: 1px solid var(--line); border-radius: 12px !important; padding: 14px; }
        .citizen-action-card:hover { border-color: rgba(99,102,241,.35); background: var(--surface); }
        .citizen-share-actions { display: grid; gap: 10px; }
        .citizen-model-row { align-items: flex-start; border-bottom: 1px solid var(--line); display: grid !important; gap: 10px; grid-template-columns: 105px 1fr; padding: 9px 0; }
        .citizen-model-row:last-child { border-bottom: 0; }
        .citizen-model-row strong { text-align: right; }

        @media (max-width: 1080px) {
          .citizen-mode-layout {
            grid-template-columns: 1fr !important;
            gap: 24px;
          }
          .citizen-status-card {
            padding: 24px !important;
          }
          .citizen-status-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 640px) {
          .citizen-status-metrics {
            grid-template-columns: 1fr !important;
          }
        }
      `}),t&&(0,d.jsx)(v,{error:t,marginBottom:24}),(0,d.jsxs)(o.div,{className:`detail-layout citizen-mode-layout`,variants:g,initial:`hidden`,animate:`show`,children:[(0,d.jsxs)(`div`,{className:`stack`,style:{minWidth:0},children:[(0,d.jsxs)(o.section,{variants:_,className:`citizen-status-card`,style:{background:p.background,color:`#fff`,borderRadius:8,padding:`40px`,boxShadow:p.boxShadow,position:`relative`,overflow:`visible`},children:[(0,d.jsx)(`div`,{style:{position:`absolute`,inset:0,overflow:`hidden`,borderRadius:16,pointerEvents:`none`,zIndex:0},children:(0,d.jsx)(i,{name:p.icon,style:{position:`absolute`,right:`-20px`,top:`-20px`,fontSize:`280px`,opacity:.1,transform:`rotate(-15deg)`}})}),(0,d.jsxs)(`div`,{style:{position:`relative`,zIndex:1},children:[(0,d.jsxs)(`div`,{className:`citizen-location-controls`,children:[(0,d.jsxs)(`div`,{className:`citizen-location-name`,children:[(0,d.jsx)(i,{name:`location_on`,style:{fontSize:20}}),(0,d.jsx)(`span`,{children:j})]}),(0,d.jsx)(N,{variant:`hero`,options:u,currentLocation:j,onRequestGps:l,onSelectWilayah:e=>{r({lat:e.lat,lon:e.lon}),s(e.label)}})]}),(0,d.jsxs)(`h1`,{className:`citizen-status-title`,style:{fontWeight:900,lineHeight:1.1,margin:`0 0 12px 0`,letterSpacing:`-0.03em`},children:[`Status `,(0,d.jsx)(`span`,{style:{color:`#fff`},children:f})]}),e?.status_label&&(0,d.jsx)(y,{data:e}),(0,d.jsx)(b,{data:e,tone:`amber`}),(0,d.jsx)(x,{data:e,dataLoaded:n}),(0,d.jsx)(`div`,{className:`citizen-status-metrics`,children:[[`Kemungkinan Rob`,e?.risk_probability==null?`-`:`${Math.round(Number(e.risk_probability))}%`,e?e.risk_probability==null?`Prediksi belum tersedia`:f:n?`Tidak tersedia`:`Memuat...`],[`Puncak Pasang (di atas muka laut rata-rata)`,e?.max_tidal_height==null?`-`:`${k.format(e.max_tidal_height)} meter`,e?.peak_time?`Pukul ${e.peak_time} WIB`:n?`Tidak tersedia`:`Menunggu Data`],[`Laporan Sekitar`,e?`${e.nearby_reports.length} laporan`:`-`,e?`Dari pantauan warga`:n?`Tidak tersedia`:`Dari pantauan warga`]].map(([e,t,n],r)=>(0,d.jsxs)(o.div,{className:`citizen-status-metric`,initial:{opacity:0,y:10},animate:{opacity:1,y:0},transition:{delay:.3+r*.1},children:[(0,d.jsx)(`div`,{style:{fontSize:13,color:`rgba(255,255,255,0.6)`,marginBottom:8,fontWeight:600,textTransform:`uppercase`,letterSpacing:`0.5px`},children:e}),(0,d.jsx)(`div`,{style:{fontSize:32,fontWeight:800,lineHeight:1,marginBottom:8},children:t}),(0,d.jsx)(`div`,{style:{fontSize:13,color:`rgba(255,255,255,0.8)`},children:n})]},e))})]})]}),(0,d.jsxs)(o.section,{variants:_,className:`panel flush`,children:[(0,d.jsxs)(`div`,{style:{padding:`24px`,borderBottom:`1px solid var(--line)`},children:[(0,d.jsx)(`h2`,{style:{fontSize:`1.25rem`,margin:0,marginBottom:4},children:`Prakiraan 7 Hari ke Depan`}),(0,d.jsx)(`p`,{style:{margin:0,color:`var(--ink-soft)`,fontSize:`14px`},children:`Sumber: model prediksi SAIBAR. Waspada saat indikator merah mendominasi.`})]}),A.length===0?(0,d.jsxs)(`div`,{style:{padding:`32px 24px`,textAlign:`center`,color:`var(--ink-soft)`,fontSize:14},children:[`Prakiraan belum tersedia untuk lokasi ini`,n?`.`:` — memuat data...`]}):(0,d.jsx)(`div`,{className:`citizen-forecast-grid`,children:A.map(({day:e,label:t,percent:n,color:r},i)=>(0,d.jsx)(S,{day:e,label:t,percent:n,color:r,index:i,className:`citizen-forecast-day`},e))})]}),(0,d.jsxs)(o.section,{variants:_,className:`panel flush`,children:[(0,d.jsxs)(`div`,{style:{padding:`20px 24px`,borderBottom:`1px solid var(--line)`,display:`flex`,flexWrap:`wrap`,gap:`16px`,alignItems:`flex-start`,justifyContent:`space-between`},children:[(0,d.jsxs)(`div`,{style:{flex:`1 1 300px`},children:[(0,d.jsx)(`h2`,{style:{fontSize:`1.25rem`,margin:0,marginBottom:4},children:`Laporan Warga di Sekitar Anda`}),(0,d.jsx)(`p`,{style:{margin:0,color:`var(--ink-soft)`,fontSize:`14px`},children:`Informasi lapangan dari masyarakat untuk meningkatkan kewaspadaan.`})]}),a()?.role===`admin`?null:(0,d.jsx)(`a`,{className:`btn secondary`,href:`#/reports`,style:{whiteSpace:`nowrap`},children:`Laporkan Genangan`})]}),(0,d.jsx)(`div`,{className:`table-responsive`,children:(0,d.jsxs)(`table`,{className:`data-table`,style:{width:`100%`,textAlign:`left`,borderCollapse:`collapse`},children:[(0,d.jsx)(`thead`,{children:(0,d.jsxs)(`tr`,{style:{background:`var(--surface-soft)`,borderBottom:`1px solid var(--line)`},children:[(0,d.jsx)(`th`,{style:{padding:`14px 24px`,color:`var(--ink-soft)`,fontSize:`13px`,fontWeight:600},children:`Kelurahan`}),(0,d.jsx)(`th`,{style:{padding:`14px 24px`,color:`var(--ink-soft)`,fontSize:`13px`,fontWeight:600},children:`Tingkat Air`}),(0,d.jsx)(`th`,{style:{padding:`14px 24px`,color:`var(--ink-soft)`,fontSize:`13px`,fontWeight:600},children:`Waktu`}),(0,d.jsx)(`th`,{style:{padding:`14px 24px`,color:`var(--ink-soft)`,fontSize:`13px`,fontWeight:600},children:`Status Validasi`})]})}),(0,d.jsxs)(`tbody`,{children:[e?.nearby_reports.length===0&&(0,d.jsx)(`tr`,{children:(0,d.jsx)(`td`,{colSpan:4,style:{padding:`16px 24px`,color:`var(--ink-soft)`},children:`Belum ada laporan tervalidasi di sekitar lokasi ini.`})}),e?.nearby_reports.map(e=>(0,d.jsxs)(`tr`,{style:{borderBottom:`1px solid var(--line)`},children:[(0,d.jsx)(`td`,{style:{padding:`16px 24px`,fontWeight:600,color:`var(--ink)`},children:m(e,!0)}),(0,d.jsx)(`td`,{style:{padding:`16px 24px`},children:(0,d.jsx)(w,{report:e})}),(0,d.jsx)(`td`,{style:{padding:`16px 24px`,color:`var(--ink-soft)`,fontSize:`14px`},children:h(e)}),(0,d.jsx)(`td`,{style:{padding:`16px 24px`},children:(0,d.jsx)(T,{label:`Divalidasi BPBD`})})]},e.id))]})]})})]})]}),(0,d.jsxs)(`aside`,{className:`stack citizen-sidebar`,style:{minWidth:0},children:[(0,d.jsx)(o.section,{variants:_,className:`panel flush`,style:{border:`none`,boxShadow:`0 4px 24px rgba(0,0,0,0.04)`},children:(0,d.jsxs)(`div`,{style:{padding:`32px 24px`},children:[(0,d.jsxs)(`div`,{style:{fontWeight:800,fontSize:18,color:`var(--ink-primary)`,display:`flex`,alignItems:`center`,gap:10,marginBottom:24},children:[(0,d.jsx)(i,{name:`verified_user`,style:{fontSize:24,color:`var(--accent-blue)`}}),`Rekomendasi Tindakan`]}),(0,d.jsx)(`div`,{className:`citizen-recommendations`,children:M.map(e=>(0,d.jsx)(C,{card:e,variant:`desktop`},e[0]))})]})}),(0,d.jsxs)(o.section,{variants:_,className:`panel`,children:[(0,d.jsx)(`h2`,{style:{fontSize:`1.15rem`,margin:`0 0 16px 0`},children:`Sebarkan Peringatan`}),(0,d.jsx)(E,{onWhatsApp:F,onCopy:I})]}),(0,d.jsx)(D,{data:e})]})]})]})}function L({data:e,error:t,dataLoaded:n,setCoordinates:r,setLocationNote:a,requestGpsLocation:s,wilayahOptions:l,risk:u,cardStyle:f,forecastDays:p,currentLocation:g,actionCards:D,handleShareWhatsApp:A,handleCopyWarning:j}){return(0,d.jsxs)(c,{active:`awam`,title:`Status Bahaya Saya`,children:[(0,d.jsx)(`style`,{children:`
        ${P}
        ${O}
        /* MOBILE NATIVE STYLES */
        .mobile-native-hero {
          background: ${f.background};
          color: white;
          padding: 32px 20px 40px 20px;
          margin: -24px -24px 24px -24px; /* Assume app-content has 24px padding */
          position: relative;
          overflow: visible;
          box-shadow: ${f.boxShadow};
          border-radius: 0;
        }
        .mobile-native-hero-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 0;
          pointer-events: none;
          z-index: 0;
        }
        
        .mobile-location-pill {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 99px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        
        .mobile-forecast-scroller {
          display: flex;
          overflow-x: auto;
          gap: 12px;
          padding: 8px 24px 24px 24px;
          margin: 0 -24px;
          scroll-snap-type: x mandatory;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .mobile-forecast-scroller::-webkit-scrollbar { display: none; }
        
        .mobile-forecast-card {
          scroll-snap-align: center;
          flex: 0 0 110px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 16px 12px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        
        .mobile-bento-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .mobile-action-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        
        .mobile-report-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .mobile-report-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        /* Overriding AppShell padding on mobile */
        @media(max-width: 768px) {
          .app-content { padding: 16px !important; }
          .mobile-native-hero { margin: -16px -16px 24px -16px !important; }
          .mobile-forecast-scroller { padding: 8px 16px 24px 16px !important; margin: 0 -16px !important; }
        }
      `}),t&&(0,d.jsx)(v,{error:t,marginBottom:16}),(0,d.jsxs)(o.section,{className:`mobile-native-hero`,initial:{opacity:0,y:-20},animate:{opacity:1,y:0},transition:{duration:.5,ease:`easeOut`},children:[(0,d.jsx)(`div`,{className:`mobile-native-hero-bg`,children:(0,d.jsx)(i,{name:f.icon,style:{position:`absolute`,right:`-30px`,top:`-10px`,fontSize:`240px`,opacity:.1,transform:`rotate(-15deg)`}})}),(0,d.jsxs)(`div`,{style:{position:`relative`,zIndex:1},children:[(0,d.jsx)(`div`,{style:{marginBottom:20},children:(0,d.jsx)(N,{variant:`mobile`,options:l,currentLocation:g,onRequestGps:s,onSelectWilayah:e=>{r({lat:e.lat,lon:e.lon}),a(e.label)}})}),e?.status_label&&(0,d.jsx)(y,{data:e,compact:!0}),(0,d.jsx)(b,{data:e,tone:`frost`}),(0,d.jsxs)(`h1`,{style:{fontSize:`2.5rem`,fontWeight:900,lineHeight:1.1,margin:`0 0 12px 0`,letterSpacing:`-0.03em`},children:[`Status`,(0,d.jsx)(`br`,{}),u]}),(0,d.jsx)(x,{data:e,dataLoaded:n,compact:!0}),(0,d.jsxs)(`div`,{style:{display:`flex`,gap:12},children:[(0,d.jsxs)(`div`,{style:{flex:1,background:`rgba(0,0,0,0.15)`,borderRadius:16,padding:`12px 16px`},children:[(0,d.jsx)(`div`,{style:{fontSize:11,color:`rgba(255,255,255,0.7)`,textTransform:`uppercase`,fontWeight:700,letterSpacing:.5,marginBottom:4},children:`Peluang`}),(0,d.jsx)(`div`,{style:{fontSize:24,fontWeight:800},children:e?.risk_probability==null?`-`:`${Math.round(Number(e.risk_probability))}%`})]}),(0,d.jsxs)(`div`,{style:{flex:1,background:`rgba(0,0,0,0.15)`,borderRadius:16,padding:`12px 16px`},children:[(0,d.jsx)(`div`,{style:{fontSize:11,color:`rgba(255,255,255,0.7)`,textTransform:`uppercase`,fontWeight:700,letterSpacing:.5,marginBottom:4},children:`Pasang (vs MSL)`}),(0,d.jsx)(`div`,{style:{fontSize:24,fontWeight:800},children:e?.max_tidal_height==null?`-`:`${k.format(e.max_tidal_height)}m`})]})]})]})]}),(0,d.jsxs)(o.section,{variants:_,initial:`hidden`,animate:`show`,style:{marginBottom:32},children:[(0,d.jsx)(`h2`,{style:{fontSize:`1.1rem`,margin:`0 0 4px 0`,fontWeight:700},children:`Prakiraan 7 Hari`}),(0,d.jsx)(`p`,{style:{margin:`0 0 16px 0`,color:`var(--ink-soft)`,fontSize:`13px`},children:`Geser untuk melihat hari berikutnya`}),p.length===0&&(0,d.jsxs)(`div`,{style:{padding:`20px 0`,color:`var(--ink-soft)`,fontSize:13},children:[`Prakiraan belum tersedia untuk lokasi ini`,n?`.`:` — memuat data...`]}),(0,d.jsx)(`div`,{className:`mobile-forecast-scroller`,children:p.map(({day:e,label:t,percent:n,color:r},i)=>(0,d.jsx)(S,{day:e,label:t,percent:n,color:r,index:i,className:`mobile-forecast-card`,compact:!0},e))})]}),(0,d.jsxs)(o.section,{variants:_,initial:`hidden`,animate:`show`,style:{marginBottom:32},children:[(0,d.jsx)(`h2`,{style:{fontSize:`1.1rem`,margin:`0 0 16px 0`,fontWeight:700},children:`Langkah Mitigasi`}),(0,d.jsx)(`div`,{className:`mobile-bento-grid`,children:D.map(e=>(0,d.jsx)(C,{card:e,variant:`mobile`},e[0]))})]}),(0,d.jsxs)(o.section,{variants:_,initial:`hidden`,animate:`show`,style:{marginBottom:32},children:[(0,d.jsx)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`flex-end`,marginBottom:16},children:(0,d.jsxs)(`div`,{children:[(0,d.jsx)(`h2`,{style:{fontSize:`1.1rem`,margin:`0 0 4px 0`,fontWeight:700},children:`Laporan Warga`}),(0,d.jsx)(`p`,{style:{margin:0,color:`var(--ink-soft)`,fontSize:`13px`},children:`Kondisi lapangan saat ini`})]})}),(0,d.jsxs)(`div`,{className:`mobile-report-list`,children:[e?.nearby_reports.length===0&&(0,d.jsx)(`div`,{style:{padding:24,textAlign:`center`,background:`var(--surface-soft)`,borderRadius:12,color:`var(--ink-soft)`,fontSize:13},children:`Belum ada laporan di sekitar Anda.`}),e?.nearby_reports.map(e=>(0,d.jsxs)(`div`,{className:`mobile-report-card`,children:[(0,d.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`flex-start`},children:[(0,d.jsx)(`strong`,{style:{fontSize:14,color:`var(--ink-primary)`},children:m(e,!1)}),(0,d.jsx)(`span`,{style:{fontSize:12,color:`var(--ink-soft)`},children:h(e)})]}),(0,d.jsxs)(`div`,{style:{display:`flex`,gap:8,marginTop:4},children:[(0,d.jsx)(w,{report:e,dense:!0}),(0,d.jsx)(T,{label:`BPBD`,dense:!0})]})]},e.id))]})]}),(0,d.jsxs)(o.section,{variants:_,initial:`hidden`,animate:`show`,style:{marginBottom:32,paddingBottom:24},children:[(0,d.jsx)(`h2`,{style:{fontSize:`1.1rem`,margin:`0 0 4px 0`,fontWeight:700},children:`Sebarkan Peringatan`}),(0,d.jsx)(`p`,{style:{margin:`0 0 16px 0`,color:`var(--ink-soft)`,fontSize:`13px`},children:`Bantu kerabat bersiap dengan membagikan informasi ini`}),(0,d.jsx)(E,{onWhatsApp:A,onCopy:j,compact:!0})]})]})}function R(){let[e,r]=(0,u.useState)(),[i,o]=(0,u.useState)(``),[s,c]=(0,u.useState)(!1),[l,f]=(0,u.useState)(`Menggunakan wilayah pesisir terdekat`),[p,m]=(0,u.useState)(null),[h,g]=(0,u.useState)([]),_=t(),v=F();(0,u.useEffect)(()=>{let e=!0;return n(`/public/map`).then(t=>{if(!e)return;let n=t.data?.regions?.features??[],r=new Set,i=[];for(let e of n){let t=M(e.geometry?.coordinates);if(!t)continue;let n=[e.properties?.village,e.properties?.district,e.properties?.regency].filter(Boolean).join(`, `)||`Wilayah pesisir`;r.has(n)||(r.add(n),i.push({label:n,lat:t[1],lon:t[0]}))}i.sort((e,t)=>e.label.localeCompare(t.label,`id`)),g(i)}).catch(()=>void 0),()=>{e=!1}},[]);let y=()=>{if(!navigator.geolocation){o(`Browser ini belum mendukung GPS. Silakan pilih wilayah secara manual.`);return}f(`Mencari lokasi perangkat…`),navigator.geolocation.getCurrentPosition(async e=>{let t=e.coords.latitude,n=e.coords.longitude;m({lat:t,lon:n});let r=new AbortController,i=window.setTimeout(()=>r.abort(),8e3);try{let e=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${t}&lon=${n}&accept-language=id`,{signal:r.signal});if(!e.ok)throw Error(`Nominatim ${e.status}`);let i=await e.json();if(i&&i.address){let e=[i.address.residential||i.address.neighbourhood||i.address.road||i.address.village||i.address.suburb,i.address.city||i.address.town||i.address.county||i.address.state].filter(Boolean).join(`, `);f(e||`Lokasi Anda`)}else f(`Lokasi perangkat`)}catch{f(`Lokasi perangkat`)}finally{window.clearTimeout(i)}},e=>{let t=`Gagal mendapatkan lokasi Anda.`;e.code===e.PERMISSION_DENIED?t=`Izin lokasi ditolak. Silakan izinkan akses GPS di browser Anda atau pilih wilayah secara manual.`:e.code===e.POSITION_UNAVAILABLE?t=`Informasi lokasi GPS tidak tersedia saat ini. Silakan coba lagi nanti.`:e.code===e.TIMEOUT&&(t=`Waktu pencarian lokasi habis (timeout). Silakan pastikan sinyal GPS stabil.`),o(t),f(`Pilih wilayah manual`)},{enableHighAccuracy:!0,timeout:15e3,maximumAge:0})};(0,u.useEffect)(()=>{let e=!0;return c(!1),n(`/public/mode-awam${p?`?lat=${p.lat}&lon=${p.lon}`:``}`).then(t=>{e&&(r(t.data??void 0),c(!0),t.data&&t.data.risk_class===`sangat_tinggi`&&typeof navigator<`u`&&navigator.vibrate&&navigator.vibrate([200,100,200]),!t.data&&t.message?o(t.message):o(``))}).catch(()=>{e&&(c(!0),o(`Data status bahaya belum bisa dimuat. Coba lagi sebentar.`))}),()=>{e=!1}},[p]),(0,u.useEffect)(()=>{let e=!0;if(navigator.permissions?.query)return navigator.permissions.query({name:`geolocation`}).then(t=>{e&&t.state===`granted`&&y()}).catch(()=>void 0),()=>{e=!1}},[]);let b=e?.risk_class?A[e.risk_class]:s||e?`Tidak Tersedia`:`Memuat...`,x=j(e?.risk_class??void 0),S=e?.region?.provenance_status===`demo`||b===`Tidak Tersedia`,C=e?.region&&!S?[e.region.village,e.region.district,e.region.regency].filter(Boolean).join(`, `):l,w=e&&e.is_monitored?(Array.isArray(e.forecast)?e.forecast:e.forecast.data).map(e=>{let t=e.prediction_date.split(`T`)[0].split(` `)[0],n=e.risk_class;return{day:new Date(`${t}T00:00:00`).toLocaleDateString(`id-ID`,{day:`numeric`,month:`short`}),label:A[n]??n,percent:Math.round(Number(e.risk_probability??0)),color:n===`sangat_tinggi`?`var(--critical)`:n===`tinggi`?`var(--high)`:n===`sedang`?`var(--medium)`:`var(--low)`}}):[],T=[[`Jauhi area rendah`,`Hindari jalan pesisir dan area yang mudah tergenang.`,`priority_high`],[`Siapkan barang penting`,`Amankan dokumen dan barang elektronik sebelum puncak pasang.`,`inventory_2`],[`Ikuti arahan BPBD`,`Jika kondisi memburuk, ikuti informasi resmi dari petugas.`,`campaign`],...a()?.role===`admin`?[]:[[`Laporkan kejadian`,`Tambahkan foto dan lokasi bila melihat genangan di sekitar Anda.`,`add_location_alt`]]],E=[`âš\xA0ï¸ Peringatan Banjir Rob — SAIBAR`,`Lokasi: ${C}`,`Status: ${b}`,...e?[...e.guidance_message?[e.guidance_message]:[],...e.risk_probability==null?[]:[`Peluang rob ${Math.round(Number(e.risk_probability))}%${e.peak_time?`, puncak pasang ${e.peak_time} WIB`:``}.`]]:[],`Sumber: SAIBAR`].join(`
`),D={data:e,error:i,dataLoaded:s,locationNote:l,coordinates:p,setCoordinates:m,setLocationNote:f,requestGpsLocation:y,wilayahOptions:h,risk:b,cardStyle:x,forecastDays:w,currentLocation:C,actionCards:T,handleShareWhatsApp:()=>{window.open(`https://wa.me/?text=${encodeURIComponent(E)}`,`_blank`,`noopener,noreferrer`)},handleCopyWarning:async()=>{try{await navigator.clipboard.writeText(E),_.success(`Teks peringatan disalin ke clipboard.`)}catch{_.error(`Gagal menyalin otomatis. Silakan salin manual.`)}}};return v?(0,d.jsx)(L,{...D}):(0,d.jsx)(I,{...D})}export{R as CitizenModePage};