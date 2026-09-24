const { Website } = require('../models');
const { computeNextScanDate } = require('../services/scanRunner.service');
const dns = require('dns').promises;
const net = require('net');

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 100 && b >= 64 && b <= 127);
  }
  const v = ip.toLowerCase();
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd')
    || v.startsWith('fe80') || v.startsWith('::ffff:127.')
    || v.startsWith('::ffff:10.') || v.startsWith('::ffff:192.168.');
}

async function assertPublicTarget(url) {
  if (process.env.ALLOW_PRIVATE_TARGETS === 'true') return null;
  const hostname = new URL(url).hostname.replace(/^\[|\]$/g, '');
  try {
    const addrs = net.isIP(hostname)
      ? [{ address: hostname }]
      : await dns.lookup(hostname, { all: true });
    if (addrs.some((a) => isPrivateAddress(a.address))) {
      return 'Scanning private or local addresses is not allowed';
    }
  } catch (err) {
    return 'Could not resolve that hostname';
  }
  return null;
}

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

function canSeeAll(user) {
  return user.role === 'Administrator' || user.role === 'Viewer';
}
const ENVIRONMENTS = ['Production', 'Staging', 'Development'];
const SCAN_FREQUENCIES = ['Manual', 'Daily', 'Weekly', 'Monthly'];
const SCAN_TYPES = ['Full', 'Headers Only', 'SSL Only', 'Quick'];

function pickWebsiteFields(body) {
  const fields = {};
  const allowed = [
    'name', 'url', 'ipAddress', 'owner', 'environment', 'serverType',
    'cmsType', 'framework', 'scanFrequency', 'scanType', 'notes', 'group',
  ];
  for (const key of allowed) {
    if (body[key] !== undefined) fields[key] = body[key];
  }
  return fields;
}

function validateWebsitePayload(fields, { partial = false } = {}) {
  if (!partial || fields.url !== undefined) {
    if (!isValidUrl(fields.url)) {
      return 'A valid http(s) URL is required';
    }
  }
  if (!partial || fields.name !== undefined) {
    if (typeof fields.name !== 'string' || fields.name.trim().length === 0) {
      return 'Website name is required';
    }
  }
  if (fields.environment !== undefined && !ENVIRONMENTS.includes(fields.environment)) {
    return `environment must be one of: ${ENVIRONMENTS.join(', ')}`;
  }
  if (fields.scanFrequency !== undefined && !SCAN_FREQUENCIES.includes(fields.scanFrequency)) {
    return `scanFrequency must be one of: ${SCAN_FREQUENCIES.join(', ')}`;
  }
  if (fields.scanType !== undefined && !SCAN_TYPES.includes(fields.scanType)) {
    return `scanType must be one of: ${SCAN_TYPES.join(', ')}`;
  }
  return null;
}

async function addWebsite(req, res) {
  try {
    const fields = pickWebsiteFields(req.body);
    const validationError = validateWebsitePayload(fields);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

        const targetError = await assertPublicTarget(fields.url);
    if (targetError) {
      return res.status(400).json({ message: targetError });
    }

    const website = await req.user.createWebsite({
      ...fields,
      nextScanDate: fields.scanFrequency && fields.scanFrequency !== 'Manual'
        ? computeNextScanDate(fields.scanFrequency)
        : null,
    });
    return res.status(201).json({ website });
  } catch (err) {
    console.error('addWebsite error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function listWebsites(req, res) {
  try {
    const where = canSeeAll(req.user) ? {} : { UserId: req.user.id };
    const websites = await Website.findAll({ where, order: [['createdAt', 'DESC']] });
    return res.status(200).json({ websites });
  } catch (err) {
    console.error('listWebsites error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getWebsite(req, res) {
  try {
    const website = await Website.findByPk(req.params.id);
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }
    if (!canSeeAll(req.user) && website.UserId !== req.user.id)  {
      return res.status(404).json({ message: 'Website not found' });
    }
    return res.status(200).json({ website });
  } catch (err) {
    console.error('getWebsite error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateWebsite(req, res) {
  try {
    const website = await Website.findByPk(req.params.id);
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }
    if (req.user.role !== 'Administrator' && website.UserId !== req.user.id) {
      return res.status(404).json({ message: 'Website not found' });
    }

    const fields = pickWebsiteFields(req.body);
    const validationError = validateWebsitePayload(fields, { partial: true });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (fields.url !== undefined) {
      const targetError = await assertPublicTarget(fields.url);
      if (targetError) {
        return res.status(400).json({ message: targetError });
      }
    }

    await website.update({
      ...fields,
      ...(fields.scanFrequency !== undefined
        ? { nextScanDate: fields.scanFrequency !== 'Manual' ? computeNextScanDate(fields.scanFrequency) : null }
        : {}),
    });
    return res.status(200).json({ website });
  } catch (err) {
    console.error('updateWebsite error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteWebsite(req, res) {
  try {
    const website = await Website.findByPk(req.params.id);
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }
    if (req.user.role !== 'Administrator' && website.UserId !== req.user.id) {
      return res.status(404).json({ message: 'Website not found' });
    }

    await website.destroy();
    return res.status(200).json({ message: 'Website deleted' });
  } catch (err) {
    console.error('deleteWebsite error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function setWebsiteStatus(req, res) {
  try {
    const { status } = req.body; // 'Enabled' | 'Disabled'
    if (!['Enabled', 'Disabled'].includes(status)) {
      return res.status(400).json({ message: "status must be 'Enabled' or 'Disabled'" });
    }

    const website = await Website.findByPk(req.params.id);
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }
    if (req.user.role !== 'Administrator' && website.UserId !== req.user.id) {
      return res.status(404).json({ message: 'Website not found' });
    }

    await website.update({ status });
    return res.status(200).json({ website });
  } catch (err) {
    console.error('setWebsiteStatus error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  addWebsite,
  listWebsites,
  getWebsite,
  updateWebsite,
  deleteWebsite,
  setWebsiteStatus,
};
