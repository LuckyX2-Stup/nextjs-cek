addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const ipPort = url.searchParams.get("ip")

  if (!ipPort) {
    return new Response(JSON.stringify({ error: "IP:Port diperlukan" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const [ip, port] = ipPort.split(":")
  if (!ip || !port) {
    return new Response(JSON.stringify({ error: "Format IP:Port salah" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    // Cek lokasi geo IP menggunakan ip-api
    const geoRes = await fetch(`http://ip-api.com/json/${ip}`)
    if (!geoRes.ok) {
      console.error('Failed to fetch geo data:', geoRes.status)
      return new Response(JSON.stringify({ error: "Gagal mengambil data lokasi IP" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
    const geoData = await geoRes.json()

    // Membuat URL untuk memeriksa proxy di Cloudflare
    const cfUrl = `https://speed.cloudflare.com/cdn-cgi/trace?ip=${ip}&port=${port}`
    const cfRes = await fetch(cfUrl)
    if (!cfRes.ok) {
      console.error('Cloudflare request failed:', cfRes.status)
      return new Response(JSON.stringify({ error: "Tidak dapat menghubungi Cloudflare" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
    const cfData = await cfRes.text()  // Cloudflare mengembalikan data dalam format teks

    // Jika berhasil, analisa data Cloudflare
    const proxyStatus = cfData.includes("cf-ray") ? "active" : "dead"

    // Simulasi status proxy berdasarkan data Cloudflare
    const result = {
      proxy: ip,
      port: parseInt(port),
      proxyip: proxyStatus,
      status: proxyStatus,
      delay: Math.floor(Math.random() * 100),  // Simulasi delay proxy
      ip: geoData.query,
      country: geoData.country,
      city: geoData.city,
      timezone: geoData.timezone,
      latitude: geoData.lat,
      longitude: geoData.lon,
      isp: geoData.isp,
      cfStatus: cfData, // Tambahkan data dari Cloudflare untuk analisis lebih lanjut
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error('Error processing request:', error)  // Log error server
    return new Response(JSON.stringify({ error: "Gagal memproses data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
