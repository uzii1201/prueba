const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
const MEDIA_DIR = path.join(__dirname, 'media');
const PASSWORD = "Prodbyuzi2004.";

app.use(express.static(__dirname));
app.use('/media', express.static(MEDIA_DIR));
app.use(express.json());

// Configuración Multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.folder;
    const folderPath = path.join(MEDIA_DIR, folder);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// API para listar archivos de una carpeta (público)
app.get('/api/files/:folder', (req, res) => {
  const folder = req.params.folder;
  const folderPath = path.join(MEDIA_DIR, folder);

  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ error: "Carpeta no encontrada" });
  }

  const files = fs.readdirSync(folderPath).map(file => ({
    name: file,
    url: `/media/${folder}/${file}`
  }));

  res.json(files);
});

// Middleware para verificar contraseña
function checkPassword(req, res, next) {
  const { password } = req.body;
  if (password !== PASSWORD) {
    return res.status(403).json({ error: 'Contraseña incorrecta' });
  }
  next();
}

// Subir archivo (requiere contraseña)
app.post('/api/upload', upload.single('file'), (req, res) => {
  const password = req.body?.password;
  if (password !== PASSWORD) {
    // Eliminar el archivo que se subió si la contraseña es incorrecta
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(403).json({ error: 'Contraseña incorrecta' });
  }
  res.json({ message: 'Archivo subido con éxito' });
});

// Eliminar archivo (requiere contraseña)
app.post('/api/delete', checkPassword, (req, res) => {
  const { folder, filename } = req.body;
  const filePath = path.join(MEDIA_DIR, folder, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Archivo no encontrado" });
  }

  fs.unlinkSync(filePath);
  res.json({ message: "Archivo eliminado correctamente" });
});

// Renombrar archivo (requiere contraseña)
app.post('/api/rename', checkPassword, (req, res) => {
  const { folder, oldName, newName } = req.body;
  const oldPath = path.join(MEDIA_DIR, folder, oldName);
  const newPath = path.join(MEDIA_DIR, folder, newName);

  if (!fs.existsSync(oldPath)) {
    return res.status(404).json({ error: "Archivo original no encontrado" });
  }
  if (fs.existsSync(newPath)) {
    return res.status(400).json({ error: "El nuevo nombre ya existe" });
  }

  fs.renameSync(oldPath, newPath);
  res.json({ message: "Archivo renombrado correctamente" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});