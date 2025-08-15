

document.addEventListener('DOMContentLoaded', ()=>{
  // Meteo Valencia
  (async ()=>{
    const el=document.getElementById('weather-mini'); if(!el) return;
    try{
      const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=39.4699&longitude=-0.3763&current=temperature_2m,weather_code');
      const j=await r.json(); const t=Math.round(j?.current?.temperature_2m||0); const code=j?.current?.weather_code||0;
      const icon=(code===0?'☀️':(code<4?'⛅':'☁️')); el.textContent=icon+' '+t+'°C · Valencia';
    }catch(e){ el.textContent='Clima ND'; }
  })();
  // Logo selector
  const logoBtn=document.getElementById('logo-edit'); const logoFile=document.getElementById('logo-file');
  const brandImg=document.querySelector('.brand img,#brand-logo-img');
  if(logoBtn && logoFile){
    logoBtn.addEventListener('click', ()=>logoFile.click());
    logoFile.addEventListener('change', e=>{ const f=e.target.files[0]; if(!f) return;
      const r=new FileReader(); r.onload=ev=>{ if(brandImg) brandImg.src=ev.target.result; localStorage.setItem('gv_logo', ev.target.result); }; r.readAsDataURL(f);
    });
    const saved=localStorage.getItem('gv_logo'); if(saved && brandImg) brandImg.src=saved;
  }
  // Hero selector
  const heroBtn=document.getElementById('hero-edit'); const heroFile=document.getElementById('hero-file'); const heroImg=document.getElementById('hero-image-display');
  if(heroBtn && heroFile && heroImg){
    heroBtn.addEventListener('click', ()=>heroFile.click());
    heroFile.addEventListener('change', e=>{ const f=e.target.files[0]; if(!f) return;
      const r=new FileReader(); r.onload=ev=>{ heroImg.src=ev.target.result; localStorage.setItem('gv_hero', ev.target.result); }; r.readAsDataURL(f);
    });
    const saved=localStorage.getItem('gv_hero'); if(saved) heroImg.src=saved;
  }
});
