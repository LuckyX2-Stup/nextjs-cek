export default async function handler(req, res) {
  const { ip, port } = req.query;  // Ambil parameter IP dan Port dari query string

  if (!ip || !port) {
    return res.status(400).json({ error: "IP dan Port diperlukan" });
  }

  const [ipAddr, ipPort] = ip.split(":"); // Pisahkan IP dan port
  if (!ipAddr || !ipPort) {
    return res.status(400).json({ error: "Format IP:Port salah" });
  }

  try {
    // Cek lokasi geo IP menggunakan ip-api
    const geoRes = await fetch(`http://ip-api.com/json/${ipAddr}`);
    if (!geoRes.ok) {
      console.error('Failed to fetch geo data:', geoRes.status);
      return res.status(500).json({ error: "Gagal mengambil data lokasi IP" });
    }
    const geoData = await geoRes.json();

    // Membuat URL untuk memeriksa proxy di Cloudflare
    const cfUrl = `https://speed.cloudflare.com/cdn-cgi/trace?ip=${ipAddr}`;
    const cfRes = await fetch(cfUrl);
    if (!cfRes.ok) {
      console.error('Cloudflare request failed:', cfRes.status);
      return res.status(500).json({ error: "Tidak dapat menghubungi Cloudflare" });
    }

    const cfData = await cfRes.text();  // Cloudflare mengembalikan data dalam format teks
    const proxyStatus = cfData.includes("cf-ray") ? "active" : "dead"; // Jika data `cf-ray` ada, berarti aktif

    // Simulasi status proxy berdasarkan data Cloudflare
    const result = {
      proxy: ipAddr,
      port: parseInt(ipPort),
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
      cfStatus: cfData,  // Tambahkan data dari Cloudflare untuk analisis lebih lanjut
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error processing request:', error); // Log error server
    return res.status(500).json({ error: "Gagal memproses data" });
  }
}
