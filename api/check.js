// pages/api/check.js
export default async function handler(req, res) {
  const { ip, port, host = 'speed.cloudflare.com', tls = true } = req.query;

  if (!ip || !port) {
    return res.status(400).json({ error: "IP dan Port diperlukan" });
  }

  const url = `https://${host}/cdn-cgi/trace`;

  try {
    // Membuat request ke Cloudflare untuk mengecek IP:Port
    const response = await fetch(`${url}?ip=${ip}&port=${port}&tls=${tls ? 'true' : 'false'}`);
    
    // Jika response dari Cloudflare tidak OK
    if (!response.ok) {
      return res.status(500).json({ error: 'Gagal terhubung ke server Cloudflare' });
    }

    // Mengambil hasil sebagai teks
    const textData = await response.text();

    // Memparsing data hasil trace
    const data = textData.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});

    // Jika tidak ada data ip, berarti tidak aktif
    if (!data.ip) {
      return res.status(500).json({ error: 'Proxy tidak aktif atau gagal terhubung' });
    }

    // Mengembalikan data JSON yang terstruktur
    return res.status(200).json({
      asOrganization: data.asOrganization,
      asn: data.asn,
      city: data.city,
      country: data.country,
      ip: data.ip,
      proxyip: data.proxyip === 'true',
      tls: data.tls,
      sni: data.sni,
      reverse: data.reverse === 'true',
      geoLocation: {
        latitude: data.latitude,
        longitude: data.longitude,
      },
      gateway: data.gateway,
      clientIp: data.clientIp,
      // Data lainnya bisa ditambahkan sesuai kebutuhan
    });
  } catch (error) {
    console.error('Error checking proxy:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memeriksa proxy' });
  }
}
