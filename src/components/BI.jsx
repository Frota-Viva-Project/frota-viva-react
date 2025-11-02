import { useState, useEffect, useRef } from 'react';
import '../styles/BI.css';

function BI() {
    const [powerBIError, setPowerBIError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const embedContainerRef = useRef(null);

    // Configuração do Power BI usando variáveis de ambiente
    const accessToken = import.meta.env.VITE_POWERBI_ACCESS_TOKEN;
    const reportId = import.meta.env.VITE_POWERBI_REPORT_ID;

    // Verificar se as variáveis de ambiente estão configuradas
    useEffect(() => {
        if (!accessToken || !reportId) {
            console.error('Variáveis de ambiente do Power BI não configuradas');
            setPowerBIError(true);
            setIsLoading(false);
        }
    }, [accessToken, reportId]);

    // Configuração do Power BI
    const reportConfig = {
        type: 'report',
        id: reportId,
        embedUrl: 'https://app.powerbi.com/reportEmbed',
        accessToken: accessToken,
        tokenType: 0, // AAD token
        settings: {
            panes: {
                filters: {
                    expanded: false,
                    visible: true
                }
            },
            background: 0 // Transparent
        }
    };

    // Carregar Power BI usando JavaScript SDK
    useEffect(() => {
        const loadPowerBI = async () => {
            try {
                // Verificar se o Power BI JavaScript SDK está disponível
                if (typeof window.powerbi === 'undefined') {
                    // Carregar o SDK dinamicamente
                    const script = document.createElement('script');
                    script.src = 'https://cdn.powerbi.com/lib/powerbi-client/2.22.0/powerbi.min.js';
                    script.onload = () => embedReport();
                    script.onerror = () => {
                        console.error('Erro ao carregar Power BI SDK');
                        setPowerBIError(true);
                        setIsLoading(false);
                    };
                    document.head.appendChild(script);
                } else {
                    embedReport();
                }
            } catch (error) {
                console.error('Erro ao inicializar Power BI:', error);
                setPowerBIError(true);
                setIsLoading(false);
            }
        };

        const embedReport = () => {
            try {
                if (embedContainerRef.current && window.powerbi) {
                    const powerbi = window.powerbi;

                    // Limpar container anterior se existir
                    powerbi.reset(embedContainerRef.current);

                    // Embedar o relatório
                    const report = powerbi.embed(embedContainerRef.current, reportConfig);

                    // Event listeners
                    report.on('loaded', () => {
                        console.log('Power BI relatório carregado com sucesso');
                        setIsLoading(false);
                        setPowerBIError(false);
                    });

                    report.on('error', (event) => {
                        console.error('Erro no Power BI:', event.detail);
                        setPowerBIError(true);
                        setIsLoading(false);
                    });

                    report.on('rendered', () => {
                        console.log('Power BI relatório renderizado');
                    });
                }
            } catch (error) {
                console.error('Erro ao embedar relatório:', error);
                setPowerBIError(true);
                setIsLoading(false);
            }
        };

        loadPowerBI();

        // Cleanup
        return () => {
            if (embedContainerRef.current && window.powerbi) {
                window.powerbi.reset(embedContainerRef.current);
            }
        };
    }, []);

    return (
        <div className="bi-container">
            <div className="bi-header">
                <h1 className="bi-title">Business Intelligence</h1>
                <p className="bi-subtitle">Dashboard analítico da frota</p>
            </div>

            <div className="bi-content">
                <div className="powerbi-container">
                    {isLoading && !powerBIError && (
                        <div className="powerbi-loading">
                            <div className="loading-spinner"></div>
                            <p>Carregando dashboard Power BI...</p>
                        </div>
                    )}

                    {!powerBIError ? (
                        <div
                            ref={embedContainerRef}
                            className="powerbi-embed-container"
                            style={{
                                width: '100%',
                                height: '600px',
                                display: isLoading ? 'none' : 'block'
                            }}
                        ></div>
                    ) : (
                        <div className="powerbi-fallback">
                            <h3>Dashboard Power BI</h3>
                            <p>Não foi possível carregar o dashboard do Power BI.</p>
                            <p>Isso pode ocorrer devido a token expirado ou problemas de conectividade.</p>
                            <div className="fallback-actions">
                                <button
                                    className="btn-reload"
                                    onClick={() => {
                                        setPowerBIError(false);
                                        setIsLoading(true);
                                        window.location.reload();
                                    }}
                                >
                                    Tentar Novamente
                                </button>
                                <a
                                    href={`https://app.powerbi.com/links/${reportId}?ctid=b148f14c-2397-402c-ab6a-1b4711177ac0&pbi_source=linkShare`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-external"
                                >
                                    Abrir em Nova Aba
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Informações adicionais */}
            <div className="bi-footer">
                <div className="bi-info">
                    <div className="info-item">
                        <span className="info-label">Dashboard:</span>
                        <span className="info-value">Power BI Integrado</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Última atualização:</span>
                        <span className="info-value">{new Date().toLocaleString('pt-BR')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BI;