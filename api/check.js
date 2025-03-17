export default async function handler(req, res) {
  const { ip, port, host = 'speed.cloudflare.com', tls = true } = req.query;

  if (!ip || !port) {
    return res.status(400).json({ error: "IP dan Port diperlukan" });
  }

  const url = `https://${host}/cdn-cgi/trace`;

  try {
    // Memeriksa konektivitas ke IP dan port
    const connectivityTest = await fetch(`http://${ip}:${port}`);

    // Jika tidak dapat terhubung ke IP:Port
    if (!connectivityTest.ok) {
      return res.status(500).json({ error: `Tidak dapat terhubung ke ${ip}:${port}` });
    }

    // Jika koneksi berhasil, lanjutkan untuk cek di Cloudflare
    const response = await fetch(`${url}?ip=${ip}&port=${port}&tls=${tls ? 'true' : 'false'}`);
    
    // Cek jika respons dari Cloudflare tidak OK
    if (!response.ok) {
      return res.status(500).json({ error: 'Gagal terhubung ke server Cloudflare' });
    }

    // Mengambil hasil dalam format teks
    const textData = await response.text();

    // Parsing teks menjadi objek JSON
    const data = textData.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});

    // Jika tidak ada data, kembalikan error
    if (!data.ip) {
      return res.status(500).json({ error: 'Proxy tidak aktif atau gagal terhubung' });
    }

    // Mengembalikan data yang sesuai
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
    });

  } catch (error) {
    console.error('Error checking proxy:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memeriksa proxy' });
  }
}
