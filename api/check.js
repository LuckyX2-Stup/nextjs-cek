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
    // Cek status proxy pada host speed.cloudflare.com
    const cfUrl = `https://speed.cloudflare.com/cdn-cgi/trace?ip=${ip}&port=${port}`
    const cfRes = await fetch(cfUrl)

    if (!cfRes.ok) {
      return new Response(JSON.stringify({ error: "Tidak dapat menghubungi Cloudflare" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const cfData = await cfRes.text()

    // Memparsing data hasil dari trace
    const data = cfData.split("\n").reduce((acc, line) => {
      const [key, value] = line.split("=")
      if (key && value) {
        acc[key] = value
      }
      return acc
    }, {})

    // Memeriksa apakah proxy tersebut aktif di Cloudflare
    if (!data.ip || data.gateway === "on") {
      return new Response(JSON.stringify({ error: "Proxy tidak aktif di Cloudflare" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Jika proxy terhubung dengan Cloudflare, tambahkan informasi geo dan status
    const geoRes = await fetch(`http://ip-api.com/json/${ip}`)
    const geoData = await geoRes.json()

    const result = {
      proxy: ip,
      port: parseInt(port),
      status: "active",
      ip: geoData.query,
      country: geoData.country,
      city: geoData.city,
      timezone: geoData.timezone,
      latitude: geoData.lat,
      longitude: geoData.lon,
      isp: geoData.isp,
      tls: data.tls || "unknown",
      sni: data.sni || "unknown",
      reverse: data.reverse || "unknown",
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Gagal memproses data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
