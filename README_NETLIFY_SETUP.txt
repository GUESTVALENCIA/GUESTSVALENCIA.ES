
Guests Valencia - SOLID Netlify Package

1) Copia la carpeta `netlify/` + `panel/` y el `package.json` a la RAÍZ de tu repo.
2) Haz commit en `main` para que Netlify redepliegue.
3) En Netlify → Site settings → Identity, habilita Netlify Identity y crea tu usuario admin (rol `admin`).
4) Variables de entorno (Site settings → Environment):
   - OPENAI_API_KEY (obligatoria)
   - OPENAI_MODEL_DEFAULT = gpt-4o-mini (o gpt-4o)
   - (Opc) OPENAI_MODEL_VISITOR / OPENAI_MODEL_GUEST / OPENAI_MODEL_PREMIUM
   - (Opc) LIMIT_VISITOR_TEXT / LIMIT_GUEST_TEXT / LIMIT_PREMIUM_TEXT
   - (Si usas voz) ELEVENLABS_API_KEY (+ ELEVENLABS_VOICE_ID)
   - (Si usas avatar) HEYGEN_API_KEY, HEYGEN_AVATAR_ID
   - (Si usas PayPal) PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET / PAYPAL_MODE

5) Panel admin: /panel/index.html
   - Inicia sesión (Netlify Identity) con rol `admin`
   - Carga y guarda la configuración de modelos por categoría (visitor/guest/premium)
   - La función sandra‑chat usará ese mapeo desde Blobs

6) Endpoints de prueba:
   - GET  /.netlify/functions/hello
   - POST /.netlify/functions/sandra-chat   { "message": "Hola", "role": "visitor" }
   - POST /.netlify/functions/sandra-tts    { "text": "Hola" }
   - GET  /.netlify/functions/model-config  (lee configuración actual)

Notas:
- El limitador de uso es DIARIO y PERSISTENTE por usuario (o IP), almacenado en Netlify Blobs.
- El mapeo de modelos también se guarda en Blobs (editable desde el panel).
- Modelos "realtime preview" NO son compatibles con Chat Completions: usa gpt‑4o o gpt‑4o‑mini.
