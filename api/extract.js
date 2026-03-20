export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { base64, fileType } = req.body;
  if (!base64 || !fileType) {
    return res.status(400).json({ error: 'Missing base64 or fileType' });
  }

  try {
    const buffer = Buffer.from(base64, 'base64');

    if (fileType === 'pdf') {
      // Use pdf-parse to extract text from PDF
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const data = await pdfParse(buffer);
      const text = data.text.trim();
      if (!text) return res.status(422).json({ error: 'No text found in PDF. Try saving as .txt instead.' });
      return res.status(200).json({ text });
    }

    if (fileType === 'docx' || fileType === 'doc') {
      // Use mammoth to extract text from DOCX
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      if (!text) return res.status(422).json({ error: 'No text found in DOCX.' });
      return res.status(200).json({ text });
    }

    return res.status(400).json({ error: 'Unsupported file type: ' + fileType });

  } catch (err) {
    return res.status(500).json({ error: 'Extraction failed: ' + err.message });
  }
}
