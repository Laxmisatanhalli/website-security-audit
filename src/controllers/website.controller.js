function isValidUrl(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

async function addWebsite(req, res) {
  try {
    const { url } = req.body;

    if (!isValidUrl(url)) {
      return res.status(400).json({ message: 'A valid http(s) URL is required' });
    }

    const website = await req.user.createWebsite({ url });

    return res.status(201).json({ website });
  } catch (err) {
    console.error('addWebsite error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function listWebsites(req, res) {
  try {
    const websites = await req.user.getWebsites({ order: [['createdAt', 'DESC']] });
    return res.status(200).json({ websites });
  } catch (err) {
    console.error('listWebsites error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { addWebsite, listWebsites };
