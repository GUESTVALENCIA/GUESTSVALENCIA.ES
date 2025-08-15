
// Mini acceso en ventanita verde (GoTrue)
(function(){
  function addScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=()=>rej(new Error('script load fail')); document.head.appendChild(s); }); }
  const css = document.createElement('style');
  css.textContent = `
  #gv-mini-access{position:fixed;right:18px;top:78px;z-index:60;display:none}
  #gv-mini-access .card{width:320px;border-radius:16px;border:1px solid rgba(0,196,140,.4);background:#eafff6;box-shadow:0 12px 30px rgba(0,0,0,.12);overflow:hidden}
  #gv-mini-access header{background:#00C48C;color:#fff;padding:10px 12px;font-weight:700;display:flex;justify-content:space-between;align-items:center}
  #gv-mini-access main{padding:12px}
  #gv-mini-access input{width:100%;padding:10px;border-radius:10px;border:1px solid #d1fae5;margin:6px 0}
  #gv-mini-access .btn{width:100%;padding:10px;border-radius:10px;border:1px solid #00C48C;background:#00C48C;color:#fff;cursor:pointer;margin-top:6px}
  #gv-mini-access .btn.ghost{background:transparent;color:#00C48C}
  #gv-mini-access .row{display:flex;gap:8px}
  #gv-mini-access .msg{font-size:12px;margin-top:6px}
  `;
  document.head.appendChild(css);
  const box = document.createElement('div');
  box.id = 'gv-mini-access';
  box.innerHTML = `
    <div class="card">
      <header>Acceso <button id="gv-close" class="btn ghost" style="width:auto;padding:6px 10px">×</button></header>
      <main>
        <input id="gv-email" placeholder="Email"/>
        <input id="gv-pass" placeholder="Contraseña" type="password"/>
        <div class="row">
          <button id="gv-login" class="btn">Entrar</button>
          <button id="gv-sign" class="btn ghost">Registrar</button>
        </div>
        <div class="msg" id="gv-msg"></div>
        <a id="gv-panel-link" href="/panel/" style="display:none;margin-top:8px;display:inline-block">Ir al panel »</a>
      </main>
    </div>`;
  document.body.appendChild(box);
  async function ensureGoTrue(){ if(window.GoTrue) return; await addScript("https://cdn.jsdelivr.net/npm/gotrue-js/dist/gotrue.min.js"); }
  function openMini(){ box.style.display='block'; } function closeMini(){ box.style.display='none'; }
  function wireNav(){
    var nav = document.querySelector('header nav, nav');
    if(!nav) return;
    var access = nav.querySelector('a[href$="acceso.html"]');
    if(!access){ access = document.createElement('a'); access.href='acceso.html'; access.textContent='Acceso'; nav.appendChild(access); }
    access.addEventListener('click', function(e){ e.preventDefault(); openMini(); });
  }
  async function doAuth(kind){
    document.getElementById('gv-msg').textContent = 'Procesando...';
    try{
      await ensureGoTrue();
      var auth = new GoTrue({ APIUrl: '/.netlify/identity', setCookie: true });
      var email = (document.getElementById('gv-email').value||'').trim();
      var pass = (document.getElementById('gv-pass').value||'').trim();
      if(!email || !pass){ document.getElementById('gv-msg').textContent = 'Completa email y contraseña'; return; }
      if(kind==='login'){
        var u = await auth.login(email, pass, true);
        document.getElementById('gv-msg').textContent = 'Conectado: ' + (u && u.email ? u.email : email);
        document.getElementById('gv-panel-link').style.display='inline-block';
      }else{
        await auth.signup(email, pass);
        document.getElementById('gv-msg').textContent = 'Registro iniciado. Revisa tu email si se requiere confirmación.';
      }
    }catch(e){ document.getElementById('gv-msg').textContent = 'Error: ' + (e && e.message ? e.message : 'desconocido'); }
  }
  wireNav();
  document.getElementById('gv-close').onclick = closeMini;
  document.getElementById('gv-login').onclick = ()=>doAuth('login');
  document.getElementById('gv-sign').onclick = ()=>doAuth('signup');
})();
