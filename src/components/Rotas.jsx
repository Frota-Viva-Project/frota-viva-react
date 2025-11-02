import { useState, useEffect, useRef } from 'react';
import '../styles/Rotas.css';
import { getMapaPorId, getCaminhaoPorId, getCoordenadasCaminhaoRota, getRotasCaminhao } from '../Utils/ManipuladorApi';

function Rotas({ deliveryId, onBack }) {
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [rotaData, setRotaData] = useState(null);
  const [entregaData, setEntregaData] = useState(null);
  const [caminhaoData, setCaminhaoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapaRef = useRef(null);
  const containerMapaRef = useRef(null);
  const [mapaCarregado, setMapaCarregado] = useState(false);
  const [localizacaoCaminhao, setLocalizacaoCaminhao] = useState(null);
  const [marcadorCaminhao, setMarcadorCaminhao] = useState(null);

  const [stops, setStops] = useState([]);

  // Carregar dados da API
  useEffect(() => {
    const carregarDados = async () => {
      if (!deliveryId) return;

      try {
        setLoading(true);
        setError(null);

        // 1. Carregar dados do mapa para obter informações básicas
        console.log(`🗺️ Carregando dados do mapa via API - ID: ${deliveryId}`);
        const mapa = await getMapaPorId(deliveryId);
        setRotaData(mapa);

        // 1.1. Buscar coordenadas específicas do mapa ID 10 (coordenadas corretas)
        console.log(`📍 Buscando coordenadas de referência do mapa ID 10...`);
        const mapaReferencia = await getMapaPorId(10);

        if (mapaReferencia && mapaReferencia.latitude && mapaReferencia.longitude) {
          console.log('✅ Coordenadas de referência obtidas:', {
            lat: mapaReferencia.latitude,
            lng: mapaReferencia.longitude
          });
        }

        let caminhaoId = deliveryId; // Usar deliveryId como caminhaoId por padrão

        if (mapa) {
          console.log('✅ Dados do mapa carregados via API:', mapa);

          // Definir localização atual do caminhão usando coordenadas do mapa ID 10 (corretas)
          if (mapaReferencia && mapaReferencia.latitude && mapaReferencia.longitude) {
            setLocalizacaoCaminhao({
              lat: parseFloat(mapaReferencia.latitude),
              lng: parseFloat(mapaReferencia.longitude),
              endereco: mapaReferencia.destino || mapaReferencia.endereco || 'Localização de Referência'
            });
            console.log('📍 Localização do caminhão definida com coordenadas do mapa ID 10');
          } else if (mapa.latitude && mapa.longitude) {
            // Fallback para coordenadas do mapa atual
            setLocalizacaoCaminhao({
              lat: parseFloat(mapa.latitude),
              lng: parseFloat(mapa.longitude),
              endereco: mapa.destino || mapa.endereco || 'Localização atual'
            });
          }

          // Usar ID do caminhão do mapa se disponível
          caminhaoId = mapa.caminhao_id || mapa.caminhaoId || deliveryId;

          // Processar dados de entrega
          setEntregaData({
            id: deliveryId,
            enderecoDestino: mapa.destino || mapa.endereco_destino || 'Destino não informado',
            descricaoCarga: mapa.carga || mapa.descricao_carga || 'Carga não especificada',
            dataPrevisaoChegada: mapa.data_previsao || mapa.dataPrevisao,
            tempoEstimado: mapa.tempo_estimado || mapa.tempoEstimado,
            status: mapa.status || 'Em andamento',
            caminhaoId: caminhaoId
          });
        }

        // 2. Buscar paradas em rota do caminhão via endpoint específico
        console.log(`🛣️ Buscando paradas em rota do caminhão ID: ${caminhaoId}`);
        try {
          const rotasCaminhao = await getRotasCaminhao(caminhaoId);

          if (rotasCaminhao && rotasCaminhao.length > 0) {
            console.log('📋 Dados brutos das rotas da API:', rotasCaminhao);

            const paradasFormatadas = rotasCaminhao.map((rota, index) => {
              // Processar diferentes formatos de coordenadas da API
              let coordinates = null;

              if (rota.latitude && rota.longitude) {
                coordinates = {
                  lat: parseFloat(rota.latitude),
                  lng: parseFloat(rota.longitude)
                };
              } else if (rota.coordenadas) {
                coordinates = {
                  lat: parseFloat(rota.coordenadas.latitude || rota.coordenadas.lat),
                  lng: parseFloat(rota.coordenadas.longitude || rota.coordenadas.lng)
                };
              }

              return {
                id: rota.id || index + 1,
                name: rota.destinoFinal || rota.destino || rota.nome || `Parada ${index + 1}`,
                status: rota.status === 'ATIVO' || rota.status === 'PENDENTE' ? 'pending' : 'completed',
                location: rota.destinoInicial || rota.origem || rota.endereco || 'Localização não informada',
                coordinates: coordinates,
                dataPrevisao: rota.dataHoraPrevisao || rota.data_previsao,
                observacoes: rota.observacoes || rota.descricao
              };
            }).filter(parada => parada.coordinates && !isNaN(parada.coordinates.lat) && !isNaN(parada.coordinates.lng));

            if (paradasFormatadas.length > 0) {
              console.log(`📍 ${paradasFormatadas.length} paradas válidas carregadas da API de rotas`);
              setStops(paradasFormatadas);
            } else {
              console.log('⚠️ Nenhuma parada com coordenadas válidas encontrada');
              // Fallback para coordenadas do mapa
              if (mapa && mapa.latitude && mapa.longitude) {
                setStops([{
                  id: 1,
                  name: mapa.destino || 'Destino Principal',
                  status: 'pending',
                  location: mapa.endereco || 'Localização não informada',
                  coordinates: {
                    lat: parseFloat(mapa.latitude),
                    lng: parseFloat(mapa.longitude)
                  }
                }]);
              }
            }
          } else {
            console.log('⚠️ Nenhuma rota encontrada para o caminhão na API');
            // Usar coordenadas do mapa como parada única se disponível
            if (mapa && mapa.latitude && mapa.longitude) {
              console.log('📍 Usando coordenadas do mapa como parada única');
              setStops([{
                id: 1,
                name: mapa.destino || 'Destino Principal',
                status: 'pending',
                location: mapa.endereco || 'Localização não informada',
                coordinates: {
                  lat: parseFloat(mapa.latitude),
                  lng: parseFloat(mapa.longitude)
                }
              }]);
            } else {
              console.log('⚠️ Sem coordenadas disponíveis, usando paradas padrão');
              // Paradas padrão como último recurso
              setStops([
                { id: 1, name: 'Localização Atual', status: 'completed', location: 'São Paulo - SP', coordinates: { lat: -23.5405, lng: -46.7050 } },
                { id: 2, name: 'Próximo Destino', status: 'pending', location: 'Destino não definido', coordinates: { lat: -23.5289, lng: -46.6997 } }
              ]);
            }
          }
        } catch (rotaErr) {
          console.warn('⚠️ Erro ao buscar rotas do caminhão:', rotaErr);
          // Em caso de erro, usar dados do mapa ou padrão
          if (mapa && mapa.latitude && mapa.longitude) {
            setStops([{
              id: 1,
              name: mapa.destino || 'Destino Principal',
              status: 'pending',
              location: mapa.endereco || 'Localização não informada',
              coordinates: {
                lat: parseFloat(mapa.latitude),
                lng: parseFloat(mapa.longitude)
              }
            }]);
          }
        }

        // 3. Carregar dados do caminhão
        try {
          const caminhao = await getCaminhaoPorId(caminhaoId);
          if (caminhao) {
            setCaminhaoData(caminhao);
            console.log('✅ Dados do caminhão carregados:', caminhao);
          }
        } catch (caminhaoErr) {
          console.warn('⚠️ Erro ao carregar dados do caminhão:', caminhaoErr);
        }

      } catch (err) {
        console.error('❌ Erro ao carregar dados da rota via API:', err);
        setError('Erro ao carregar dados da rota via API. Usando dados de exemplo.');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [deliveryId]);

  // Função para carregar o script do Google Maps
  const carregarGoogleMapsScript = () => {
    if (!window.google) {
      const script = document.createElement('script');
      // Use sua própria API key aqui - a key precisa ter permissões corretas
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAg3fX74cIZj3CyWJP7mWlxyDjTGABRuWs`;
      script.async = true;
      script.defer = true;
      script.onload = inicializarMapa;
      document.head.appendChild(script);
    } else {
      inicializarMapa();
    }
  };

  // Inicialização do mapa usando a API do Google Maps
  const inicializarMapa = () => {
    if (!containerMapaRef.current || mapaCarregado) return;

    // Usar localização do caminhão como centro, ou coordenadas padrão
    const localizacaoPadrao = localizacaoCaminhao || { lat: -23.5405, lng: -46.7050 };

    // Estilos customizados para o mapa (mais profissional e clean)
    const estilosMapa = [
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#7c7c7c' }]
      },
      {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'administrative',
        elementType: 'geometry',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'administrative.land_parcel',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'administrative.neighborhood',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'poi',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }]
      },
      {
        featureType: 'road',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'road.arterial',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }]
      },
      {
        featureType: 'transit',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#a8ddf5' }]
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }]
      }
    ];

    // Criar uma instância do mapa
    const opcoesMapa = {
      zoom: 13,
      center: localizacaoPadrao,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      styles: estilosMapa,
      gestureHandling: 'greedy'
    };

    const mapa = new window.google.maps.Map(containerMapaRef.current, opcoesMapa);
    mapaRef.current = mapa;
    setMapaCarregado(true);

    // 1. Adicionar marcador do caminhão (localização atual) com ícone de pin vermelho
    if (localizacaoCaminhao) {
      console.log('📍 Criando marcador do caminhão na posição:', localizacaoCaminhao);
      const marcadorCaminhaoNovo = new window.google.maps.Marker({
        position: localizacaoCaminhao,
        map: mapa,
        title: `Localização do Caminhão ${caminhaoData?.placa || 'BCD2E34'}`,
        animation: window.google.maps.Animation.BOUNCE,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: '#E53E3E',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        },
        zIndex: 1000 // Garantir que fica acima dos outros marcadores
      });

      setMarcadorCaminhao(marcadorCaminhaoNovo);
      console.log('✅ Marcador do caminhão criado com sucesso');

      // Janela de informação do caminhão
      const infowindowCaminhao = new window.google.maps.InfoWindow({
        content: `
          <div class="custom-infowindow">
            <div class="infowindow-header truck">
              <span class="infowindow-icon">📍</span>
              <h3 class="infowindow-title">Localização do Caminhão</h3>
            </div>
            <div class="infowindow-content">
              <p class="infowindow-location"><strong>Placa:</strong> ${caminhaoData?.placa || 'BCD2E34'}</p>
              <p class="infowindow-location"><strong>Motorista:</strong> ${caminhaoData?.motorista?.nome || 'Pedro Henrique Vicente Duarte'}</p>
              <p class="infowindow-location"><strong>Endereço:</strong> ${localizacaoCaminhao.endereco}</p>
              <p class="infowindow-location"><strong>Coordenadas:</strong> ${localizacaoCaminhao.lat.toFixed(6)}, ${localizacaoCaminhao.lng.toFixed(6)}</p>
              <div class="infowindow-status">
                <span class="status-dot active"></span>
                <span class="status-text">Localização Atual</span>
              </div>
            </div>
          </div>`,
        ariaLabel: 'Localização do Caminhão'
      });

      marcadorCaminhaoNovo.addListener('click', () => {
        infowindowCaminhao.open(mapa, marcadorCaminhaoNovo);
      });
    }

    // 2. Adicionar marcadores para cada parada
    stops.forEach((stop, index) => {
      if (stop.coordinates) {
        const posicao = {
          lat: stop.coordinates.lat,
          lng: stop.coordinates.lng
        };

        // Criar um marcador personalizado para paradas
        const marcador = new window.google.maps.Marker({
          position: posicao,
          map: mapa,
          title: stop.name,
          animation: window.google.maps.Animation.DROP,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: stop.status === 'completed' ? '#52c788' : '#2c3e5a',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          },
          label: {
            text: (index + 1).toString(),
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        });

        // Criar janela de informação estilizada
        const conteudoJanela = `
          <div class="custom-infowindow">
            <div class="infowindow-header ${stop.status}">
              <span class="infowindow-number">${index + 1}</span>
              <h3 class="infowindow-title">${stop.name}</h3>
            </div>
            <div class="infowindow-content">
              <p class="infowindow-location">${stop.location}</p>
              <div class="infowindow-status">
                <span class="status-dot ${stop.status}"></span>
                <span class="status-text">${stop.status === 'completed' ? 'Concluído' : 'Pendente'}</span>
              </div>
            </div>
          </div>`;

        const infowindow = new window.google.maps.InfoWindow({
          content: conteudoJanela,
          ariaLabel: stop.name
        });

        // Adicionar evento de clique ao marcador
        marcador.addListener('click', () => {
          infowindow.open(mapa, marcador);
        });
      }
    });

    // 3. Ajustar o zoom para mostrar todos os marcadores (incluindo o caminhão)
    const bounds = new window.google.maps.LatLngBounds();

    // Incluir localização do caminhão
    if (localizacaoCaminhao) {
      bounds.extend(new window.google.maps.LatLng(localizacaoCaminhao.lat, localizacaoCaminhao.lng));
    }

    // Incluir todas as paradas
    stops.forEach(stop => {
      if (stop.coordinates) {
        bounds.extend(new window.google.maps.LatLng(
          stop.coordinates.lat,
          stop.coordinates.lng
        ));
      }
    });

    // Se há pontos para mostrar, ajustar o zoom
    if (!bounds.isEmpty()) {
      mapa.fitBounds(bounds);
      // Garantir zoom mínimo
      const listener = window.google.maps.event.addListener(mapa, 'idle', () => {
        if (mapa.getZoom() > 16) mapa.setZoom(16);
        window.google.maps.event.removeListener(listener);
      });
    }
  };

  // Carregar o script do Google Maps quando o componente for montado
  useEffect(() => {
    carregarGoogleMapsScript();

    return () => {
      // O Google Maps gerencia seus próprios recursos
    };
  }, []);

  // Reinicializar o mapa quando os dados mudarem
  useEffect(() => {
    if (mapaCarregado && !loading) {
      // Limpar mapa existente e reinicializar
      setMapaCarregado(false);
      setTimeout(() => {
        inicializarMapa();
      }, 100);
    }
  }, [stops, localizacaoCaminhao, loading]);

  // Funções de controle do mapa
  function ampliarMapa() {
    if (mapaRef.current) {
      const zoom = mapaRef.current.getZoom();
      mapaRef.current.setZoom(zoom + 1);
    }
  }

  function reduzirMapa() {
    if (mapaRef.current) {
      const zoom = mapaRef.current.getZoom();
      mapaRef.current.setZoom(zoom - 1);
    }
  }

  function resetarMapa() {
    if (mapaRef.current && stops.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      stops.forEach(stop => {
        if (stop.coordinates) {
          bounds.extend(new window.google.maps.LatLng(
            stop.coordinates.lat,
            stop.coordinates.lng
          ));
        }
      });
      mapaRef.current.fitBounds(bounds);
    }
  }

  const handleStopClick = (stop) => {
    setSelectedDelivery(stop);

    // Centralizar no marcador clicado
    if (mapaRef.current && stop.coordinates) {
      mapaRef.current.setCenter(stop.coordinates);
      mapaRef.current.setZoom(15);
    }
  };

  return (
    <main className="rotas-container">
      {/* Botão de voltar estilizado */}
      <button
        className="btn-voltar-entregas"
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '100px',
          left: '20px',
          zIndex: 1000,
          backgroundColor: '#FF6B35',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#E55A2B';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 16px rgba(255, 107, 53, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#FF6B35';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3)';
        }}
      >
        <span style={{ fontSize: '16px' }}>←</span>
        Voltar para Entregas
      </button>

      <div className="rotas-content" style={{ paddingTop: '0' }}>
        <div className="rotas-map-container">
          <div ref={containerMapaRef} className="rotas-map">
            <div className="map-controls">
              <button className="map-control-btn" onClick={ampliarMapa}>+</button>
              <button className="map-control-btn" onClick={reduzirMapa}>−</button>
              <button className="map-control-btn" onClick={resetarMapa}>⟲</button>
            </div>
          </div>
        </div>

        <div className="rotas-sidebar">
          <div className="rotas-details-card">
            <div className="rotas-details-header">
              <h2>Detalhes</h2>
            </div>

            {loading ? (
              <div className="loading-info">
                <p>Carregando informações...</p>
              </div>
            ) : (
              <>
                <div className="rotas-driver-info">
                  <div className="rotas-avatar">👤</div>
                  <div className="rotas-driver-details">
                    <h3>{caminhaoData?.motorista?.nome || 'Pedro Henrique VICENTE Duarte'}</h3>
                    <div className="rotas-driver-meta">
                      <div className="meta-item">
                        <span className="meta-label">Caminhão:</span>
                        <span className="meta-value">{caminhaoData?.placa || 'QWEO-3470'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Status:</span>
                        <span className="tag tag-active">
                          {entregaData?.status || 'Atrasada'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rotas-delivery-info">
                  <div className="info-row">
                    <span className="info-label">Destino:</span>
                    <span className="info-value">
                      {entregaData?.enderecoDestino || 'Av. dos Autonomistas, 1400 - Vila Yara, Osasco - SP, 06020-010'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Número de Entrega:</span>
                    <span className="info-value">#{deliveryId || '0001'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Conteúdo da Entrega:</span>
                    <span className="info-value">
                      {entregaData?.descricaoCarga || 'Jogos de Videogame'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Chegada Prevista:</span>
                    <span className="info-value">
                      {entregaData?.dataPrevisaoChegada
                        ? new Date(entregaData.dataPrevisaoChegada).toLocaleDateString('pt-BR')
                        : 'DD/MM/YYYY'
                      }
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tempo Estimado:</span>
                    <span className="info-value">
                      {entregaData?.tempoEstimado || 'DD/MM/YYYY - HH/MM/SS'}
                    </span>
                  </div>

                  {/* Informações da localização atual do caminhão */}
                  {localizacaoCaminhao && (
                    <div className="info-row" style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '18px' }}>📍</span>
                        <span className="info-label" style={{ fontWeight: '600', color: '#E53E3E' }}>LOCALIZAÇÃO ATUAL:</span>
                      </div>
                      <span className="info-value" style={{ fontSize: '0.9rem', color: '#333', fontWeight: '500' }}>
                        {localizacaoCaminhao.endereco}
                      </span>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#666',
                        marginTop: '8px',
                        fontFamily: 'monospace',
                        backgroundColor: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div>Lat: {localizacaoCaminhao.lat.toFixed(6)}</div>
                        <div>Lng: {localizacaoCaminhao.lng.toFixed(6)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="rotas-stops-card">
            <h2 className="stops-title">Paradas</h2>
            <div className="stops-list">
              {stops.map((stop) => (
                <button
                  key={stop.id}
                  className={`stop-item ${stop.status}`}
                  onClick={() => handleStopClick(stop)}
                >
                  <span className="stop-status-dot"></span>
                  <div className="stop-info">
                    <span className="stop-name">{stop.name}</span>
                    <span className="stop-location">{stop.location}</span>
                  </div>
                  <span className="stop-badge">
                    {stop.status === 'completed' ? '✓' : 'Parada em (Local)'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Rotas;