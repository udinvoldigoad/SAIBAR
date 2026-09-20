import{a as e}from"./rolldown-runtime-CNC7AqOf.js";import{d as t,g as n,h as r,i,l as a,v as o}from"./index-3SriM4Pb.js";import{t as s}from"./AppShell-lg2MjUen.js";import{i as c}from"./reportData-CGfCvT5X.js";import{n as l,t as u}from"./risk-DvTubYA5.js";import{t as d}from"./maplibre-gl-CGiZGnkb.js";var f=e(o(),1),p=e(d(),1),m=n(),h={sangat_tinggi:`critical`,tinggi:`high`,sedang:`medium`,rendah:`low`},g={"Kota Bandar Lampung":{center:[105.266,-5.4496],zoom:12},"Kabupaten Lampung Selatan":{center:[105.5898,-5.7335],zoom:11},"Kabupaten Pesawaran":{center:[105.15,-5.5],zoom:11},"Kabupaten Tanggamus":{center:[104.7,-5.45],zoom:11},"Kabupaten Pesisir Barat":{center:[103.95,-5.18],zoom:10},"Kabupaten Lampung Timur":{center:[105.68,-5.05],zoom:10},"Kabupaten Tulang Bawang":{center:[105.8,-4.4],zoom:10},"Kabupaten Tulang Bawang Barat":{center:[105.05,-4.45],zoom:10},"Kabupaten Mesuji":{center:[105.4,-4.05],zoom:10},"Kabupaten Lampung Tengah":{center:[105.25,-4.85],zoom:10},"Kabupaten Lampung Utara":{center:[104.85,-4.8],zoom:10},"Kabupaten Way Kanan":{center:[104.55,-4.5],zoom:10},"Kabupaten Lampung Barat":{center:[104.2,-5.05],zoom:10},"Kabupaten Pringsewu":{center:[104.98,-5.35],zoom:11},"Kota Metro":{center:[105.3,-5.11],zoom:12}},_={hidden:{opacity:0},show:{opacity:1,transition:{staggerChildren:.1,ease:`easeOut`}}},v={hidden:{opacity:0,y:15},show:{opacity:1,y:0,transition:{type:`spring`,stiffness:300,damping:24}}},y=new Intl.NumberFormat(`id-ID`);function b(e){return l[String(e)]??String(e??`Belum ada data`)}function x(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function S(e){let t=new Date(`${e}T00:00:00`),n=new Date;return n.setHours(0,0,0,0),Math.round((t.getTime()-n.getTime())/864e5)}function C(e){let t=S(e);return Number.isNaN(t)?e:t===0?`Hari ini`:t>0?`+${t} hari`:`${Math.abs(t)} hari lalu`}var w=[{label:`Hari ini`,offset:0},{label:`+1 hari`,offset:1},{label:`+2 hari`,offset:2},{label:`+3 hari`,offset:3},{label:`+7 hari`,offset:7}];function T(e){let t=new Date;return t.setHours(0,0,0,0),t.setDate(t.getDate()+e),`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)}`}function E(e){let t=[],n=e=>{if(Array.isArray(e)){if(typeof e[0]==`number`&&typeof e[1]==`number`){t.push([e[0],e[1]]);return}e.forEach(n)}};if(n(e.geometry.coordinates),!t.length)return null;let[r,i]=[Math.min(...t.map(([e])=>e)),Math.max(...t.map(([e])=>e))],[a,o]=[Math.min(...t.map(([,e])=>e)),Math.max(...t.map(([,e])=>e))];return[(r+i)/2,(a+o)/2]}function D(e){return{sangat_tinggi:.8,tinggi:.6,sedang:.4,rendah:.2}[String(e)]??.2}function O(e,t){let[n,r]=e,i=r*Math.PI/180,a=n*Math.PI/180,o=t/6371;return{type:`Polygon`,coordinates:[Array.from({length:49},(e,t)=>{let n=t*7.5*Math.PI/180,r=Math.asin(Math.sin(i)*Math.cos(o)+Math.cos(i)*Math.sin(o)*Math.cos(n));return[(a+Math.atan2(Math.sin(n)*Math.sin(o)*Math.cos(i),Math.cos(o)-Math.sin(i)*Math.sin(r)))*180/Math.PI,r*180/Math.PI]})]}}var k=10,A={rendah:1,sedang:2,tinggi:3,sangat_tinggi:4};function j({icon:e,ariaLabel:t,value:n,options:i,onChange:o}){let[s,c]=(0,f.useState)(!1),l=(0,f.useRef)(null);(0,f.useEffect)(()=>{if(!s)return;let e=e=>{l.current&&!l.current.contains(e.target)&&c(!1)},t=e=>{e.key===`Escape`&&c(!1)};return document.addEventListener(`mousedown`,e),document.addEventListener(`keydown`,t),()=>{document.removeEventListener(`mousedown`,e),document.removeEventListener(`keydown`,t)}},[s]);let u=i.find(e=>e.value===n);return(0,m.jsxs)(`div`,{ref:l,className:`filter-select`,style:{position:`relative`,minWidth:0},children:[(0,m.jsxs)(`button`,{type:`button`,className:`layer-menu-btn`,onClick:()=>c(e=>!e),"aria-expanded":s,"aria-haspopup":`listbox`,"aria-label":t,style:{display:`flex`,alignItems:`center`,gap:8,minHeight:44,padding:`0 14px`,borderRadius:10,border:`1px solid var(--line)`,background:`var(--surface)`,color:`var(--ink)`,cursor:`pointer`,fontSize:14,fontWeight:500,width:`100%`,textAlign:`left`},children:[(0,m.jsx)(r,{name:e,style:{fontSize:18,color:`var(--accent)`}}),(0,m.jsx)(`span`,{style:{flex:1,minWidth:0,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},children:u?.short??u?.label??``}),(0,m.jsx)(r,{name:`expand_more`,style:{fontSize:18,color:`var(--ink-soft)`,transform:s?`rotate(180deg)`:`none`,transition:`transform .2s`}})]}),s&&(0,m.jsx)(a.div,{initial:{opacity:0,y:-6},animate:{opacity:1,y:0},transition:{duration:.15},className:`filter-select-dropdown`,role:`listbox`,children:i.map(e=>(0,m.jsx)(`button`,{type:`button`,role:`option`,"aria-selected":e.value===n,"data-value":e.value,className:`filter-option`,onClick:()=>{o(e.value),c(!1)},children:e.label},e.value))})]})}function M({regions:e,reports:t,layers:n,activeLayers:r,selectedRegency:i,userLocation:a,onSelectFeature:o}){let s=(0,f.useRef)(null),l=(0,f.useRef)(null),d=(0,f.useRef)(null),h=(0,f.useRef)([]),_=(0,f.useRef)([]),v=(0,f.useRef)([]),y=(0,f.useRef)([]),S=(0,f.useRef)([]),C=(0,f.useRef)(o);C.current=o;let w=(0,f.useRef)(e);w.current=e;let T=(0,f.useRef)(!1),j=(0,f.useRef)(!1);return(0,f.useEffect)(()=>{if(!(!s.current||l.current))return l.current=new p.default.Map({container:s.current,center:[105.26,-5.48],zoom:9,style:{version:8,glyphs:`/fonts/{fontstack}/{range}.pbf`,sources:{osm:{type:`raster`,tiles:[`https://tile.openstreetmap.org/{z}/{x}/{y}.png`],tileSize:256,attribution:`© OpenStreetMap contributors`}},layers:[{id:`osm`,type:`raster`,source:`osm`}]}}),l.current.addControl(new p.default.NavigationControl,`top-right`),l.current.addControl(new p.default.ScaleControl({maxWidth:120,unit:`metric`}),`bottom-right`),l.current.on(`load`,()=>{j.current=!0}),()=>{l.current?.remove(),l.current=null,j.current=!1}},[]),(0,f.useEffect)(()=>{let e=l.current;if(!e||!a)return;let t=()=>{d.current?.remove();let t=document.createElement(`div`);t.className=`user-location-marker`,t.setAttribute(`aria-label`,`Lokasi Anda`),t.title=`Lokasi Anda`,d.current=new p.default.Marker({element:t}).setLngLat(a).addTo(e),e.flyTo({center:a,zoom:14,duration:1200})};return j.current?t():e.once(`load`,t),()=>{e.off(`load`,t)}},[a]),(0,f.useEffect)(()=>{let a=l.current;if(!a)return;let o=(o=!0)=>{_.current.forEach(e=>e.remove()),_.current=[],h.current.forEach(e=>e.remove()),h.current=[],v.current.forEach(e=>e.remove()),v.current=[],y.current.forEach(e=>e.remove()),y.current=[],S.current.forEach(e=>e.remove()),S.current=[];let s=[],l=[],d=a.getZoom()>=k,f=a.getBounds();r.bahaya_rob&&e.features.forEach(e=>{let t=E(e);if(!t)return;let n=String(e.properties.risk_class),r=u[n]??u.rendah,i=D(n);if(s.push({type:`Feature`,geometry:O(t,i),properties:{color:r,risk_class:n}}),l.push({type:`Feature`,geometry:{type:`Point`,coordinates:t},properties:{regionId:String(e.id??``),color:r,riskRank:A[n]??1,probability:Number(e.properties.risk_probability)||0}}),!d||!f.contains(t))return;let o=document.createElement(`button`);o.type=`button`,o.className=`map-risk-badge`,o.style.color=r,o.textContent=String(Math.round(Number(e.properties.risk_probability??0))),o.addEventListener(`click`,t=>{t.stopPropagation(),C.current(e)});let c=new p.default.Marker({element:o}).setLngLat(t).addTo(a);o.setAttribute(`aria-label`,`${e.properties.village??`Wilayah pesisir`}: risiko ${b(n)}`),_.current.push(c)}),r.laporan&&t.features.forEach(e=>{let t=e.geometry.coordinates;if(!Array.isArray(t)||typeof t[0]!=`number`)return;let n=String(e.properties.severity),r=n===`sangat_parah`?u.sangat_tinggi:n===`parah`?u.tinggi:n===`sedang`?u.sedang:u.rendah,i=n===`sangat_parah`?.6:n===`parah`?.4:n===`sedang`?.2:.1;s.push({type:`Feature`,geometry:O([t[0],t[1]],i),properties:{color:r,risk_class:n}});let o=e.properties.incident_time?new Date(String(e.properties.incident_time)).toLocaleString(`id-ID`,{day:`numeric`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`,timeZone:`Asia/Jakarta`})+` WIB`:null,l=new p.default.Popup({offset:25}).setHTML(`<strong>Laporan: ${x(e.properties.report_code??`Warga`)}</strong><br>${x(e.properties.location??`Wilayah pesisir`)}${o?`<br>Waktu kejadian: ${x(o)}`:``}<br>Tingkat Genangan: <span style="color:${r}; font-weight:bold;">${x(c[n]??n)}</span><br>Ketinggian air: ${x(e.properties.water_height_cm??`-`)} cm`);h.current.push(new p.default.Marker({color:r}).setLngLat([t[0],t[1]]).setPopup(l).addTo(a))}),r.pasang_surut&&n.tidal_stations.features.forEach(e=>{let t=e.geometry.coordinates;if(!Array.isArray(t)||typeof t[0]!=`number`||typeof t[1]!=`number`)return;let n=new p.default.Popup({offset:20}).setHTML(`<strong>Stasiun pasang surut</strong><br>${x(e.properties.name??e.properties.code??`-`)}<br>Sumber: ${x(e.properties.source??`-`)}`);v.current.push(new p.default.Marker({color:`#0284c7`}).setLngLat([t[0],t[1]]).setPopup(n).addTo(a))}),r.infrastruktur_kritis&&n.critical_infrastructure.features.forEach(e=>{let t=e.geometry.coordinates;if(!Array.isArray(t)||typeof t[0]!=`number`||typeof t[1]!=`number`)return;let n=new p.default.Popup({offset:20}).setHTML(`<strong>Infrastruktur Kritis</strong><br>${x(e.properties.name??`-`)}<br>Tipe: ${x(e.properties.type??`-`)}`);y.current.push(new p.default.Marker({color:`#9333ea`}).setLngLat([t[0],t[1]]).setPopup(n).addTo(a))}),r.evakuasi&&n.evacuation_routes.features.forEach(e=>{let t=e.geometry.coordinates;if(!Array.isArray(t)||typeof t[0]!=`number`||typeof t[1]!=`number`)return;let n=new p.default.Popup({offset:20}).setHTML(`<strong>Rute Evakuasi</strong><br>${x(e.properties.name??`-`)}`);S.current.push(new p.default.Marker({color:`#16a34a`}).setLngLat([t[0],t[1]]).setPopup(n).addTo(a))});let m=`coastline-layer`,j=r.garis_pantai?n.coastlines:{type:`FeatureCollection`,features:[]},M=a.getSource(m);M?M.setData(j):(a.addSource(m,{type:`geojson`,data:j}),a.addLayer({id:`coastline-layer-line`,type:`line`,source:m,paint:{"line-color":`#0369a1`,"line-width":2,"line-opacity":.75}}));let N=`risk-circles`,P=a.getSource(N);P?P.setData({type:`FeatureCollection`,features:s}):(a.addSource(N,{type:`geojson`,data:{type:`FeatureCollection`,features:s}}),a.addLayer({id:`risk-circles-fill`,type:`fill`,source:N,minzoom:k,paint:{"fill-color":[`get`,`color`],"fill-opacity":.4}}),a.addLayer({id:`risk-circles-line`,type:`line`,source:N,minzoom:k,paint:{"line-color":[`get`,`color`],"line-width":2}}));let F=`risk-points`,I={type:`FeatureCollection`,features:l},L=a.getSource(F);if(L?L.setData(I):(a.addSource(F,{type:`geojson`,data:I,cluster:!0,clusterRadius:48,clusterMaxZoom:k,clusterProperties:{maxRank:[`max`,[`get`,`riskRank`]],sumProb:[`+`,[`get`,`probability`]],maxProb:[`max`,[`get`,`probability`]]}}),a.addLayer({id:`risk-clusters`,type:`circle`,source:F,filter:[`has`,`point_count`],maxzoom:k,paint:{"circle-color":[`case`,[`>=`,[`get`,`maxRank`],4],u.sangat_tinggi,[`>=`,[`get`,`maxRank`],3],u.tinggi,[`>=`,[`get`,`maxRank`],2],u.sedang,u.rendah],"circle-radius":[`step`,[`get`,`point_count`],15,5,19,15,25,40,31],"circle-opacity":.9,"circle-stroke-width":3,"circle-stroke-color":`#fff`}}),a.addLayer({id:`risk-cluster-labels`,type:`symbol`,source:F,filter:[`has`,`point_count`],maxzoom:k,layout:{"text-field":[`concat`,[`to-string`,[`round`,[`get`,`maxProb`]]],`%`],"text-font":[`opensans`],"text-size":12,"text-allow-overlap":!0},paint:{"text-color":`#ffffff`}}),a.addLayer({id:`risk-unclustered`,type:`circle`,source:F,filter:[`!`,[`has`,`point_count`]],maxzoom:k,paint:{"circle-color":[`get`,`color`],"circle-radius":7,"circle-stroke-width":2,"circle-stroke-color":`#fff`}})),T.current||(T.current=!0,a.on(`click`,`risk-clusters`,e=>{let t=e.features?.[0];!t||t.geometry.type!==`Point`||a.easeTo({center:[t.geometry.coordinates[0],t.geometry.coordinates[1]],zoom:Math.min(a.getZoom()+2,12)})}),a.on(`click`,`risk-unclustered`,e=>{let t=e.features?.[0]?.properties?.regionId;if(!t)return;let n=w.current.features.find(e=>String(e.id)===String(t));n&&C.current(n)}),[`risk-clusters`,`risk-unclustered`].forEach(e=>{a.on(`mouseenter`,e,()=>{a.getCanvas().style.cursor=`pointer`}),a.on(`mouseleave`,e,()=>{a.getCanvas().style.cursor=``})})),!o)return;a.resize();let R=null,z=0;e.features.forEach(e=>{let t=E(e);t&&(z++,R?R.extend(t):R=new p.default.LngLatBounds(t,t))});let B=R;if(B){if(z===1){let e=B.getSouthWest();B.extend([e.lng-.05,e.lat-.05]),B.extend([e.lng+.05,e.lat+.05])}a.fitBounds(B,{padding:60,maxZoom:13,duration:1e3})}else if(i&&i!==`all`){let e=g[i]||g[`Kabupaten ${i}`]||g[`Kota ${i}`];e?a.flyTo({center:e.center,zoom:e.zoom,duration:1e3}):a.flyTo({center:[105.26,-5.48],zoom:9,duration:1e3})}else a.flyTo({center:[105.26,-5.48],zoom:9,duration:1e3})},s=()=>o();j.current?o():a.once(`load`,s);let d=()=>o(!1);return a.on(`moveend`,d),()=>{a.off(`moveend`,d),a.off(`load`,s)}},[e,t,n,r,i]),(0,m.jsx)(`div`,{ref:s,className:`map-canvas`,style:{minHeight:560,width:`100%`},"aria-label":`Peta interaktif risiko banjir rob`})}function N(){let e=i()?.role??``,[n,o]=(0,f.useState)({type:`FeatureCollection`,features:[]}),[c,d]=(0,f.useState)({type:`FeatureCollection`,features:[]}),[p,g]=(0,f.useState)({tidal_stations:{type:`FeatureCollection`,features:[]},coastlines:{type:`FeatureCollection`,features:[]},critical_infrastructure:{type:`FeatureCollection`,features:[]},evacuation_routes:{type:`FeatureCollection`,features:[]}}),[x,S]=(0,f.useState)(null),[D,O]=(0,f.useState)(null),[k,A]=(0,f.useState)([]),[N,P]=(0,f.useState)(`all`),[F,I]=(0,f.useState)(`all`),[L,R]=(0,f.useState)({bahaya_rob:!0,laporan:!1,pasang_surut:!1,garis_pantai:!1,infrastruktur_kritis:!1,evakuasi:!1}),[z,B]=(0,f.useState)(null),[V,H]=(0,f.useState)(!0),[U,ee]=(0,f.useState)(``),[W,G]=(0,f.useState)(!1),K=(0,f.useRef)(null),[q,te]=(0,f.useState)(!1),[J,Y]=(0,f.useState)(!1),[ne,X]=(0,f.useState)(null),[re,ie]=(0,f.useState)(null);(0,f.useEffect)(()=>{if(!W)return;let e=e=>{K.current&&!K.current.contains(e.target)&&G(!1)},t=e=>{e.key===`Escape`&&G(!1)};return document.addEventListener(`mousedown`,e),document.addEventListener(`keydown`,t),()=>{document.removeEventListener(`mousedown`,e),document.removeEventListener(`keydown`,t)}},[W]),(0,f.useEffect)(()=>{t(`/public/predictions`).then(e=>A(e.data)).catch(()=>void 0)},[]),(0,f.useEffect)(()=>{let e=!0,n=new URLSearchParams;return N!==`all`&&n.set(`regency`,N),F!==`all`&&n.set(`date`,F),H(!0),ee(``),t(`/public/map${n.size?`?${n.toString()}`:``}`).then(t=>{e&&(o(t.data.regions),d(t.data.reports),t.data.layers&&g(t.data.layers),S(t.data.active_warning??null),O(t.data.data_freshness??null))}).catch(t=>{e&&(ee(t instanceof Error?t.message:`Data peta belum bisa dimuat.`),o({type:`FeatureCollection`,features:[]}),d({type:`FeatureCollection`,features:[]}))}).finally(()=>{e&&H(!1)}),()=>{e=!1}},[F,N]);let ae=(0,f.useMemo)(()=>{let e=k.map(e=>e.region?.regency).filter(Boolean);return[...new Set(e)].sort((e,t)=>String(e).localeCompare(String(t),`id`))},[k]),Z=(0,f.useMemo)(()=>n.features.reduce((e,t)=>{let n={rendah:1,sedang:2,tinggi:3,sangat_tinggi:4};return!e||(n[String(t.properties.risk_class)]??0)>(n[String(e.properties.risk_class)]??0)?t:e},null),[n]),oe=D?.is_stale??!1;(0,f.useEffect)(()=>{if(!n.features.length){B(null);return}B(e=>(e&&n.features.find(t=>t.id===e.id))??Z)},[n,Z]);let se=(0,f.useCallback)(e=>B(e),[]),ce=(0,f.useCallback)(()=>{if(!(`geolocation`in navigator)){X(`Perangkat ini tidak mendukung deteksi lokasi.`);return}Y(!0),X(null),navigator.geolocation.getCurrentPosition(e=>{let{latitude:t,longitude:r}=e.coords,i=null,a=1/0;if(n.features.forEach(e=>{let n=E(e);if(!n)return;let o=(n[0]-r)**2+(n[1]-t)**2;o<a&&(a=o,i=e)}),Y(!1),ie([r,t]),!i){X(`Belum ada data wilayah untuk dicocokkan.`);return}B(i)},e=>{Y(!1),X(e.code===e.PERMISSION_DENIED?`Izin lokasi ditolak. Aktifkan izin lokasi di browser lalu coba lagi.`:`Gagal mendapatkan lokasi. Coba lagi.`)},{enableHighAccuracy:!0,timeout:15e3,maximumAge:0})},[n]),le=String(z?.properties.risk_class??``),Q=u[le]??`var(--accent)`,$=z?.properties.population,ue=F===`all`?`Prediksi terbaru`:`Prediksi ${C(F)}`,de=(0,m.jsxs)(m.Fragment,{children:[(0,m.jsxs)(a.div,{variants:v,className:`panel`,style:{padding:16,borderLeft:`3px solid ${u[String(Z?.properties.risk_class)]??`var(--accent)`}`},children:[(0,m.jsxs)(`div`,{style:{display:`flex`,alignItems:`flex-start`,gap:10},children:[(0,m.jsx)(r,{name:`warning`,style:{fontSize:20,color:u[String(Z?.properties.risk_class)]??`var(--accent)`,flexShrink:0}}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`strong`,{style:{display:`block`,marginBottom:3,color:`var(--ink)`,fontSize:13},children:Z?`Risiko ${b(Z.properties.risk_class)} terdeteksi`:V?`Memuat peringatan risiko`:`Tidak ada prediksi untuk tanggal ini`}),(0,m.jsx)(`span`,{style:{color:`var(--ink-soft)`,fontSize:12,lineHeight:1.5},children:Z?`${Z.properties.village??`Wilayah pesisir`}, ${Z.properties.regency??`Lampung`} · peluang rob ${Math.round(Number(Z.properties.risk_probability??0))}%`:V?`Mengambil data peta dari server.`:`Coba pilih tanggal atau kabupaten lain.`})]})]}),(!e||e===`warga`)&&(0,m.jsx)(`a`,{className:`btn secondary`,href:`#/awam`,style:{marginTop:12,width:`100%`,justifyContent:`center`},children:`Lihat mode awam`})]}),oe&&(0,m.jsx)(a.div,{variants:v,className:`panel`,style:{padding:16,borderLeft:`3px solid #d97706`,background:`#fef3c7`},children:(0,m.jsxs)(`div`,{style:{display:`flex`,alignItems:`flex-start`,gap:10},children:[(0,m.jsx)(r,{name:`history`,style:{fontSize:20,color:`#b45309`,flexShrink:0}}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`strong`,{style:{display:`block`,marginBottom:3,color:`#78350f`,fontSize:13},children:`Prediksi Belum Diperbarui`}),(0,m.jsx)(`span`,{style:{color:`#92400e`,fontSize:12,lineHeight:1.5},children:D?.notice??`Pembaruan prediksi harian tertunda. Anda melihat prediksi yang dibuat ${D?.last_generated_at?String(D.last_generated_at).substring(0,10):`sebelumnya`}.`})]})]})})]});return(0,m.jsxs)(s,{active:`map`,title:`Peta Bahaya Rob`,subtitle:`Pantau prediksi risiko banjir rob per wilayah pesisir Provinsi Lampung.`,children:[(0,m.jsx)(`style`,{children:`
      .public-map-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 24px;
        align-items: start;
      }
      /* Desktop: peringatan tampil di kolom kanan. Wadah mobile di-display:none
         sehingga tidak ikut menempati sel grid (grid tetap 2 kolom). */
      .map-warnings-desktop { display: grid; gap: 14px; }
      .map-warnings-mobile { display: none; }
      .map-filter-bar {
        display: flex;
        align-items: flex-start;
        gap: 28px;
        row-gap: 16px;
        flex-wrap: wrap;
      }
      /* Desktop lebar: paksa 3 kolom sebaris. Panel di layout ini cukup sempit
         (≈ viewport − 732px), jadi 3 kolom baru dipaksa mulai 1280px; di bawahnya
         tetap wrap agar label & tombol tak berdesakan. */
      @media (min-width: 1280px) {
        .map-filter-bar {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: start;
          gap: 20px;
        }
        /* minmax(0,1fr) butuh anak yang boleh menyusut; inline field punya
           min-width:190 sehingga di-nol-kan agar 3 kolom muat sebaris. */
        .map-filter-bar > div { min-width: 0 !important; }
        /* Kolom lebih ramping: rapatkan tombol & ringkas teks layer jadi
           "1 dari 6" agar muat tanpa terpotong. */
        .map-filter-bar .layer-menu-btn { padding: 0 12px; gap: 7px; }
        .map-filter-bar .layer-btn-suffix { display: none; }
      }
      /* Teks tombol layer dipangkas rapi bila kolom sempit (tak mepet). */
      .map-filter-bar .layer-menu-btn > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .map-filter-bar > label {
        display: grid;
        gap: 9px;
        flex: 1;
        min-width: 190px;
        max-width: 320px;
        font-size: 11px;
        font-weight: 700;
        color: var(--ink-soft);
        text-transform: uppercase;
        letter-spacing: .5px;
      }
      .map-filter-bar select { min-height: 44px; }
      /* Dropdown custom horizon & kabupaten — seragam dengan dropdown layer. */
      .filter-select-dropdown {
        position: absolute; top: 100%; left: 0; margin-top: 6px; z-index: 20;
        min-width: 100%;
        background: var(--surface); border: 1px solid var(--line);
        border-radius: 12px; box-shadow: 0 12px 32px rgba(15, 23, 42, .16);
        padding: 6px; display: grid; gap: 1px;
        max-height: 288px; overflow-y: auto;
      }
      .filter-option {
        display: flex; align-items: center; gap: 8px;
        width: 100%; padding: 9px 12px; border-radius: 8px;
        font: inherit; font-size: 13px; font-weight: 500; color: var(--ink);
        background: transparent; border: 0; cursor: pointer;
        text-align: left; white-space: nowrap;
        transition: background .12s;
      }
      .filter-option:hover { background: var(--surface-soft); }
      .filter-option[aria-selected="true"] { background: var(--surface-soft); color: var(--accent); font-weight: 700; }
      .layer-menu-btn { transition: border-color .15s, box-shadow .15s; }
      .layer-menu-btn:hover, .layer-menu-btn[aria-expanded="true"] { border-color: var(--accent); box-shadow: 0 1px 6px rgba(2, 132, 199, .12); }
      .layer-option { transition: background .12s; }
      .layer-option:hover { background: var(--surface-soft); }
      /* Tombol ringkas filter — hanya tampil di mobile (lihat media query). */
      .map-filter-toggle {
        display: none;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 14px 18px;
        background: var(--surface);
        border: none;
        border-bottom: 1px solid var(--line);
        color: var(--ink);
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
      }
      .map-viewport { position: relative; }
      .map-viewport .map-toolbar {
        right: auto;
        width: auto;
        max-width: calc(100% - 120px);
        gap: 0;
        box-shadow: 0 2px 10px rgba(15, 23, 42, .10);
      }
      .map-viewport .map-toolbar span {
        color: var(--ink-soft);
        font-weight: 600;
        padding-right: 12px;
      }
      .map-viewport .map-toolbar strong {
        color: var(--ink);
        padding-left: 12px;
        border-left: 1px solid var(--line);
      }
      .map-viewport .maplibregl-ctrl-top-right { z-index: 3; }
      /* Penanda lokasi asli pengguna: titik biru dengan denyut halus. */
      .user-location-marker {
        width: 18px; height: 18px; border-radius: 50%;
        background: #2563eb; border: 3px solid #fff;
        box-shadow: 0 1px 4px rgba(15, 23, 42, .4);
        animation: user-loc-pulse 2s ease-out infinite;
      }
      @keyframes user-loc-pulse {
        0% { box-shadow: 0 1px 4px rgba(15,23,42,.4), 0 0 0 0 rgba(37,99,235,.45); }
        70% { box-shadow: 0 1px 4px rgba(15,23,42,.4), 0 0 0 16px rgba(37,99,235,0); }
        100% { box-shadow: 0 1px 4px rgba(15,23,42,.4), 0 0 0 0 rgba(37,99,235,0); }
      }
      /* Elemennya <button> asli — reset gaya bawaan browser (padding, font,
         appearance) supaya lingkaran 30px-nya tetap presisi. */
      .map-risk-badge {
        align-items: center;
        appearance: none;
        background: #fff;
        border: 2px solid currentColor;
        border-radius: 999px;
        box-shadow: 0 2px 6px rgba(15, 23, 42, .3);
        cursor: pointer;
        display: flex;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 850;
        height: 30px;
        justify-content: center;
        line-height: 1;
        padding: 0;
        width: 30px;
        color: inherit;
      }
      .map-risk-badge:focus-visible {
        outline: 3px solid var(--accent);
        outline-offset: 2px;
      }

      /* Layout 1 kolom mulai dari tablet (<=1080px), disamakan dengan breakpoint
         sidebar di tokens.css. Di 769-1080px layout lama (1fr 340px) menyisakan
         peta hanya ~460px sementara panel mengambil 340px — sempit. Blok ini
         SENGAJA hanya memuat aturan tingkat layout; penyesuaian tipografi mungil
         khas ponsel tetap di blok <=768px agar tak ikut mengecil di tablet. */
      @media(max-width: 1080px) {
        .public-map-layout {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        /* Grid jadi 1 kolom: peringatan naik ke atas peta, salinan kolom kanan
           disembunyikan agar tidak tampil dobel. */
        .map-warnings-mobile { display: grid; gap: 12px; }
        .map-warnings-desktop { display: none; }
      }

      @media(max-width: 768px) {
        /* Ketiga filter tampil sejajar 3 kolom rapat di atas peta (tanpa tombol
           ringkas): hemat ruang vertikal & langsung terlihat. Baris label diberi
           tinggi tetap agar label 1–2 baris tak menggeser sejajarnya kontrol. */
        .map-filter-toggle { display: none; }

        .map-filter-bar,
        .map-filter-bar.is-open {
          display: grid;
          /* minmax(0,1fr), bukan 1fr (= minmax(auto,1fr)): tanpa ini kolom
             berisi teks panjang (nama kabupaten) melebar & menekan kolom lain
             ("mepet") alih-alih dipangkas. */
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: start;
          gap: 8px;
          padding: 12px 14px !important;
        }
        .map-filter-bar > div {
          display: grid !important;
          grid-template-rows: 26px auto;
          /* Kolom implisit grid default auto (= max-content) membuat tombol
             melebar ke lebar teks penuh & chevron terdorong keluar. minmax(0,1fr)
             mengunci lebar ke sel sehingga teks dipangkas rapi. */
          grid-template-columns: minmax(0, 1fr);
          gap: 6px !important;
          min-width: 0 !important;
          max-width: none !important;
          font-size: 10px;
        }
        .map-filter-bar > div > strong {
          font-size: 10px !important;
          letter-spacing: .3px !important;
          line-height: 1.25;
        }
        /* Dropdown horizon & kabupaten dilebarkan agar teks opsi (mis. nama
           kabupaten panjang) tak terpotong kolom sempit. */
        .map-filter-bar .filter-select-dropdown {
          min-width: 190px;
          width: max-content;
          max-width: calc(100vw - 40px);
        }
        .map-filter-bar .layer-menu-btn {
          min-height: 42px !important;
          padding: 0 6px !important;
          gap: 4px !important;
          font-size: 12px !important;
        }
        /* Ikon dikecilkan di mobile agar label pendek (mis. "Terbaru") muat utuh. */
        .map-filter-bar .layer-menu-btn .material-symbols-outlined { font-size: 16px !important; }
        /* Ikon layer (biru) tetap tampil; teks diringkas jadi "1 dari 6" saja
           dengan menyembunyikan sufiks " layer aktif" agar muat kolom sempit. */
        .map-filter-bar .layer-menu-btn > span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .map-filter-bar .layer-btn-suffix { display: none; }
        /* Dropdown layer dilebarkan agar label opsi tak terpotong kolom sempit;
           dijangkarkan ke kanan supaya melebar ke kiri (tetap di dalam layar). */
        .map-filter-bar .layer-dropdown {
          left: auto !important;
          right: 0 !important;
          min-width: 200px;
          width: max-content;
          max-width: calc(100vw - 40px);
        }

        /* Dua lapis harus dibatasi: .map-container DAN div maplibre di dalamnya
           (.map-canvas) yang punya minHeight 560 inline — kalau hanya luarnya,
           konten dalam yang lebih tinggi tetap memaksa peta jadi 560px. */
        .map-container,
        .map-canvas {
          min-height: 46vh !important;
          height: 46vh !important;
        }

        .map-viewport .map-toolbar span { display: none; }
        .map-viewport .map-toolbar strong { border-left: 0; padding-left: 0; }

        /* Legenda dikeluarkan dari overlay peta: jadi strip mendatar di bawah
           peta agar tidak menimpa atribusi OSM & skala, dan area peta tetap utuh.
           (.legend sudah berada setelah .map-container di DOM.) */
        .legend {
          position: static;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 14px;
          max-width: none;
          padding: 12px 16px;
          border: 0;
          border-top: 1px solid var(--line);
          border-radius: 0;
          background: var(--surface);
        }
        .legend strong { width: 100%; font-size: 0.78rem; }
        .legend span { font-size: 0.8rem; }
      }
    `}),(0,m.jsxs)(a.div,{variants:_,initial:`hidden`,animate:`show`,className:`stack`,style:{maxWidth:1200,margin:`0 auto`,padding:`0 24px`},children:[U&&(0,m.jsx)(`div`,{className:`alert`,style:{borderLeftColor:`var(--critical)`},children:U}),(0,m.jsxs)(a.div,{variants:v,className:`public-map-layout`,children:[(0,m.jsx)(`div`,{className:`map-warnings-mobile`,children:de}),(0,m.jsxs)(`div`,{className:`panel flush`,style:{overflow:`hidden`},children:[(0,m.jsxs)(`button`,{type:`button`,className:`map-filter-toggle`,onClick:()=>te(e=>!e),"aria-expanded":q,children:[(0,m.jsx)(r,{name:`tune`,style:{fontSize:18,color:`var(--accent)`}}),(0,m.jsxs)(`span`,{style:{flex:1},children:[`Filter`,(F===`all`?0:1)+(N===`all`?0:1)>0?` · ${(F===`all`?0:1)+(N===`all`?0:1)} aktif`:``]}),(0,m.jsx)(r,{name:`expand_more`,style:{fontSize:18,color:`var(--ink-soft)`,transform:q?`rotate(180deg)`:`none`,transition:`transform .2s`}})]}),(0,m.jsxs)(`div`,{className:`map-filter-bar${q?` is-open`:``}`,style:{padding:`20px 24px`,borderBottom:`1px solid var(--line)`,background:`var(--surface)`},children:[(0,m.jsxs)(`div`,{className:`filter-field`,style:{display:`flex`,flexDirection:`column`,gap:9,flex:1,minWidth:190,maxWidth:320},children:[(0,m.jsx)(`strong`,{style:{fontSize:11,textTransform:`uppercase`,letterSpacing:.5,color:`var(--ink-soft)`},children:`Horizon prediksi`}),(0,m.jsx)(j,{icon:`schedule`,ariaLabel:`Horizon prediksi`,value:F,onChange:I,options:[{value:`all`,label:`Terbaru`},...w.map(e=>({value:T(e.offset),label:e.label}))]})]}),(0,m.jsxs)(`div`,{className:`filter-field`,style:{display:`flex`,flexDirection:`column`,gap:9,flex:1,minWidth:190,maxWidth:320},children:[(0,m.jsx)(`strong`,{style:{fontSize:11,textTransform:`uppercase`,letterSpacing:.5,color:`var(--ink-soft)`},children:`Kabupaten/Kota`}),(0,m.jsx)(j,{icon:`place`,ariaLabel:`Kabupaten/Kota`,value:N,onChange:P,options:[{value:`all`,label:`Semua wilayah`,short:`Semua`},...ae.map(e=>({value:e,label:e,short:e.replace(/^(Kabupaten|Kota)\s+/,``)}))]})]}),(0,m.jsxs)(`div`,{ref:K,style:{position:`relative`,display:`flex`,flexDirection:`column`,gap:9,flex:1,minWidth:190,maxWidth:320},children:[(0,m.jsx)(`strong`,{style:{fontSize:11,textTransform:`uppercase`,letterSpacing:.5,color:`var(--ink-soft)`},children:`Pilihan Layer`}),(0,m.jsxs)(`button`,{type:`button`,onClick:()=>G(e=>!e),"aria-expanded":W,"aria-haspopup":`true`,className:`layer-menu-btn`,style:{display:`flex`,alignItems:`center`,gap:8,minHeight:44,padding:`0 14px`,borderRadius:10,border:`1px solid var(--line)`,background:`var(--surface)`,color:`var(--ink)`,cursor:`pointer`,fontSize:14,fontWeight:500,width:`100%`,textAlign:`left`},children:[(0,m.jsx)(r,{name:`layers`,style:{fontSize:18,color:`var(--accent)`}}),(0,m.jsxs)(`span`,{style:{flex:1,minWidth:0},children:[Object.values(L).filter(Boolean).length,` dari 6`,(0,m.jsx)(`span`,{className:`layer-btn-suffix`,children:` layer aktif`})]}),(0,m.jsx)(r,{name:`expand_more`,style:{fontSize:18,color:`var(--ink-soft)`,transform:W?`rotate(180deg)`:`none`,transition:`transform .2s`}})]}),W&&(0,m.jsx)(a.div,{initial:{opacity:0,y:-6},animate:{opacity:1,y:0},transition:{duration:.15},className:`layer-dropdown`,style:{position:`absolute`,top:`100%`,left:0,right:0,marginTop:6,zIndex:20,background:`var(--surface)`,border:`1px solid var(--line)`,borderRadius:12,boxShadow:`0 12px 32px rgba(15, 23, 42, .16)`,padding:6,display:`grid`,gridTemplateColumns:`1fr`,gap:1},children:Object.entries({bahaya_rob:`Bahaya Rob`,laporan:`Laporan Warga`,pasang_surut:`Pasang Surut`,garis_pantai:`Garis Pantai`,infrastruktur_kritis:`Infrastruktur`,evakuasi:`Jalur Evakuasi`}).map(([e,t])=>(0,m.jsxs)(`label`,{className:`layer-option`,style:{display:`flex`,alignItems:`center`,gap:9,cursor:`pointer`,fontSize:13,textTransform:`none`,letterSpacing:`normal`,minWidth:`auto`,fontWeight:500,color:`var(--ink)`,margin:0,padding:`8px 10px`,borderRadius:8},children:[(0,m.jsx)(`input`,{type:`checkbox`,style:{width:15,height:15,cursor:`pointer`,flexShrink:0,accentColor:`var(--accent)`},checked:L[e],onChange:t=>R(n=>({...n,[e]:t.target.checked}))}),(0,m.jsx)(`span`,{style:{lineHeight:1.2,whiteSpace:`nowrap`},children:t})]},e))})]})]}),(0,m.jsxs)(`div`,{className:`map-viewport`,children:[(0,m.jsxs)(`div`,{className:`map-toolbar`,children:[(0,m.jsx)(`span`,{children:`Pesisir Lampung`}),(0,m.jsx)(`strong`,{children:ue})]}),(0,m.jsx)(`div`,{className:`map-container`,style:{minHeight:560},children:(0,m.jsx)(M,{regions:n,reports:c,layers:p,activeLayers:L,selectedRegency:N,userLocation:re,onSelectFeature:se})}),(0,m.jsxs)(`div`,{className:`legend`,children:[(0,m.jsx)(`strong`,{children:`Legenda risiko`}),Object.entries(l).map(([e,t])=>(0,m.jsxs)(`span`,{children:[(0,m.jsx)(`i`,{className:`dot ${h[e]}`}),t]},e))]}),V&&(0,m.jsx)(`div`,{style:{position:`absolute`,inset:0,display:`grid`,placeItems:`center`,background:`var(--scrim)`,color:`var(--ink)`,fontWeight:700},children:`Memuat peta.`})]})]}),(0,m.jsxs)(`aside`,{className:`stack`,style:{gap:14},children:[(0,m.jsx)(a.div,{variants:v,className:`panel flush`,children:(0,m.jsx)(`div`,{className:`map-stats-grid`,style:{display:`grid`,gridTemplateColumns:`repeat(3, 1fr)`,background:`var(--surface)`},children:[[n.features.length,`Zona tanggal ini`,`var(--ink)`],[c.features.length,`Laporan valid (100 terbaru)`,`var(--low)`],[n.features.filter(e=>[`tinggi`,`sangat_tinggi`].includes(String(e.properties.risk_class))).length,`Risiko tinggi+`,`var(--critical)`]].map(([e,t,n])=>(0,m.jsxs)(`div`,{style:{padding:`16px 8px`,textAlign:`center`},children:[(0,m.jsx)(`strong`,{style:{display:`block`,fontSize:21,color:String(n)},children:e}),(0,m.jsx)(`span`,{style:{fontSize:11,color:`var(--ink-soft)`},children:t})]},String(t)))})}),x&&(0,m.jsxs)(a.div,{variants:v,className:`panel`,style:{padding:20},children:[(0,m.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:8,marginBottom:8},children:[(0,m.jsx)(r,{name:`campaign`,style:{color:`var(--critical)`}}),(0,m.jsx)(`strong`,{style:{fontSize:13},children:`Peringatan Risiko`})]}),(0,m.jsx)(`p`,{style:{margin:0,fontSize:13},children:x.message})]}),(0,m.jsx)(`div`,{className:`map-warnings-desktop`,children:de}),(0,m.jsxs)(a.div,{variants:v,className:`panel flush`,children:[(0,m.jsxs)(`div`,{style:{padding:`16px 20px`,borderBottom:`1px solid var(--line)`},children:[(0,m.jsx)(`strong`,{style:{fontSize:12,textTransform:`uppercase`,letterSpacing:.5,color:`var(--ink-soft)`},children:`Wilayah terpilih`}),z?(0,m.jsxs)(`div`,{style:{marginTop:10,display:`flex`,justifyContent:`space-between`,alignItems:`flex-start`,gap:10},children:[(0,m.jsxs)(`div`,{style:{minWidth:0},children:[(0,m.jsx)(`div`,{style:{fontWeight:700,color:`var(--ink)`},children:String(z.properties.village??`Wilayah pesisir`)}),(0,m.jsx)(`div`,{style:{fontSize:13,color:`var(--ink-soft)`,marginTop:2},children:[z.properties.district,z.properties.regency].filter(Boolean).join(`, `)})]}),(0,m.jsx)(`span`,{className:`badge`,style:{flexShrink:0,background:`${Q}1a`,color:Q,borderColor:`${Q}33`},children:b(le)})]}):(0,m.jsx)(`p`,{style:{margin:`10px 0 0`,fontSize:13},children:`Klik salah satu titik di peta untuk melihat detail wilayah.`})]}),z&&(0,m.jsxs)(`div`,{style:{padding:`16px 20px`,display:`grid`,gap:12},children:[(0,m.jsxs)(`div`,{className:`info-item`,children:[(0,m.jsx)(r,{name:`insights`}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`strong`,{children:`Probabilitas`}),(0,m.jsxs)(`p`,{children:[Math.round(Number(z.properties.risk_probability??0)),`%`]})]})]}),(0,m.jsxs)(`div`,{className:`info-item`,children:[(0,m.jsx)(r,{name:`groups`}),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`strong`,{children:`Populasi risiko`}),(0,m.jsx)(`p`,{children:typeof $==`number`&&$>0?`${y.format($)} jiwa`:`Data belum tersedia`})]})]}),(0,m.jsxs)(`button`,{type:`button`,className:`btn secondary`,onClick:ce,disabled:J,"data-loading":J||void 0,style:{justifyContent:`center`},children:[(0,m.jsx)(r,{name:`my_location`}),` `,J?`Mendeteksi lokasi…`:`Deteksi lokasi saya`]}),ne&&(0,m.jsx)(`p`,{style:{margin:`-4px 0 0`,fontSize:12,color:`var(--critical)`},children:ne}),(0,m.jsxs)(`a`,{className:`btn primary`,href:`#/reports`,style:{justifyContent:`center`},children:[(0,m.jsx)(r,{name:`add_location_alt`}),` Lapor Kejadian di Sini`]})]})]})]})]})]})]})}export{N as PublicMapPage};