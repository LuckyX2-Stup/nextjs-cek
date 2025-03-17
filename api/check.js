export default async function handler(req, res) {
  const { ip, port, host = 'speed.cloudflare.com', tls = true } = req.query;

  if (!ip || !port) {
    return res.status(400).json({ error: "IP dan Port diperlukan" });
  }

  const url = `https://${host}/cdn-cgi/trace`;

  try {
    const response = await fetch(`${url}?ip=${ip}&port=${port}&tls=${tls ? 'true' : 'false'}`);
    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: 'Proxy tidak aktif atau gagal terhubung' });
    }

    return res.status(200).json({
      asOrganization: data.asOrganization,
      asn: data.asn,
      city: data.city,
      country: data.country,
      ip: data.ip,
      proxyip: data.proxyip,
      tls: data.tls,
      sni: data.sni,
      reverse: data.reverse,
      geoLocation: {
        latitude: data.latitude,
        longitude: data.longitude,
      },
      gateway: data.gateway,
      clientIp: data.clientIp,
      // Tambahkan data lain yang relevan sesuai kebutuhan
    });

  } catch (error) {
    console.error('Error checking proxy:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memeriksa proxy' });
  }
}
