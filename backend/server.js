const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// AQUÍ PONES TU URL DE N8N PARA INCAPACIDADES
// ==========================================
const N8N_WEBHOOK_URL = 'https://n8n.rbgct.cloud/webhook-test/48a49824-8c85-487f-9d96-0f04f6e778ea';

app.use(cors());

const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.post('/api/enviar-incapacidad', upload.any(), async (req, res) => {
    try {
        console.log('Recibiendo datos de incapacidad...');

        const formData = new FormData();

        // Agregar campos de texto (incluye el identificador generado en JS)
        for (const key in req.body) {
            formData.append(key, req.body[key]);
        }

        // Agregar archivos PDF
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const fileStream = fs.createReadStream(file.path);
                formData.append(file.fieldname, fileStream, file.originalname);
            });
        }

        console.log(`Enviando a n8n: ${N8N_WEBHOOK_URL}`);

        const n8nResponse = await axios.post(N8N_WEBHOOK_URL, formData, {
            headers: { ...formData.getHeaders() },
            validateStatus: function (status) {
                return status >= 200 && status < 500;
            }
        });

        // Limpieza de archivos temporales
        if (req.files) {
            req.files.forEach(file => fs.unlink(file.path, () => {}));
        }

        res.status(n8nResponse.status).json(n8nResponse.data);

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

app.listen(port, () => {
    console.log(`Backend Incapacidades escuchando en puerto ${port}`);
});