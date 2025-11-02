// CloudinaryManager.js - Gerenciador de upload de imagens para Cloudinary

class CloudinaryManager {
    constructor() {
        this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        this.apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

        if (!this.cloudName || !this.uploadPreset) {
            console.error('Cloudinary não configurado. Verifique as variáveis de ambiente.');
        }
    }

    /**
     * Faz upload de uma imagem para o Cloudinary
     * @param {File} file - Arquivo de imagem
     * @param {Function} onSuccess - Callback de sucesso (recebe a URL segura)
     * @param {Function} onError - Callback de erro (recebe mensagem de erro)
     * @param {Function} onProgress - Callback de progresso (recebe porcentagem)
     */
    uploadImage(file, onSuccess, onError, onProgress = null) {
        if (!this.cloudName || !this.uploadPreset) {
            onError('Cloudinary não configurado corretamente');
            return;
        }

        if (!file) {
            onError('Nenhum arquivo selecionado');
            return;
        }

        // Validar tipo de arquivo
        if (!this.isValidImageFile(file)) {
            onError('Tipo de arquivo não suportado. Use JPG, PNG, GIF, WebP, BMP ou TIFF');
            return;
        }

        // Validar tamanho do arquivo (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            onError('Arquivo muito grande. Máximo permitido: 10MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);
        formData.append('cloud_name', this.cloudName);

        // Configurações adicionais para otimização
        formData.append('quality', 'auto');
        formData.append('fetch_format', 'auto');
        formData.append('folder', 'profile_pictures'); // Organizar em pasta

        const xhr = new XMLHttpRequest();

        // Monitorar progresso do upload
        if (onProgress) {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentComplete);
                }
            });
        }

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.secure_url) {
                        onSuccess(response.secure_url);
                    } else {
                        onError('Resposta inválida do Cloudinary');
                    }
                } catch (error) {
                    onError('Erro ao processar resposta do servidor');
                }
            } else {
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    onError(errorResponse.error?.message || 'Erro no upload');
                } catch {
                    onError(`Erro HTTP: ${xhr.status}`);
                }
            }
        });

        xhr.addEventListener('error', () => {
            onError('Erro de conexão com o servidor');
        });

        xhr.addEventListener('timeout', () => {
            onError('Timeout no upload. Tente novamente');
        });

        xhr.timeout = 60000; // 60 segundos de timeout

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
        xhr.open('POST', cloudinaryUrl);
        xhr.send(formData);
    }

    /**
     * Valida se o arquivo é uma imagem suportada
     * @param {File} file - Arquivo a ser validado
     * @returns {boolean} - True se for válido
     */
    isValidImageFile(file) {
        const validTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp',
            'image/tiff'
        ];
        return validTypes.includes(file.type.toLowerCase());
    }

    /**
     * Redimensiona uma imagem antes do upload (opcional)
     * @param {File} file - Arquivo original
     * @param {number} maxWidth - Largura máxima
     * @param {number} maxHeight - Altura máxima
     * @param {number} quality - Qualidade (0-1)
     * @returns {Promise<File>} - Arquivo redimensionado
     */
    resizeImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calcular novas dimensões mantendo proporção
                let { width, height } = img;

                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Desenhar imagem redimensionada
                ctx.drawImage(img, 0, 0, width, height);

                // Converter para blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const resizedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(resizedFile);
                        } else {
                            reject(new Error('Erro ao redimensionar imagem'));
                        }
                    },
                    file.type,
                    quality
                );
            };

            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Gera uma URL de transformação do Cloudinary
     * @param {string} publicId - ID público da imagem
     * @param {Object} transformations - Transformações a aplicar
     * @returns {string} - URL transformada
     */
    getTransformedUrl(publicId, transformations = {}) {
        if (!this.cloudName || !publicId) return '';

        const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`;

        // Transformações padrão para fotos de perfil
        const defaultTransforms = {
            width: 200,
            height: 200,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto',
            format: 'auto'
        };

        const finalTransforms = { ...defaultTransforms, ...transformations };

        // Construir string de transformações
        const transformString = Object.entries(finalTransforms)
            .map(([key, value]) => `${key}_${value}`)
            .join(',');

        return `${baseUrl}/${transformString}/${publicId}`;
    }
}

// Instância singleton
const cloudinaryManager = new CloudinaryManager();

export default cloudinaryManager;

// Exportar também a classe para casos específicos
export { CloudinaryManager };