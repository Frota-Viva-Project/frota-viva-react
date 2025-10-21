import { useState, useEffect, useRef } from 'react';
import '../styles/Rotas.css';

function Rotas({ deliveryId, onBack }) {
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const mapaRef = useRef(null);
  const containerMapaRef = useRef(null);
  const [mapaCarregado, setMapaCarregado] = useState(false);
  
  const [stops, setStops] = useState([
    { id: 1, name: 'Hospital Perinari', status: 'completed', location: 'VILA JAGUARÁ', coordinates: { lat: -23.5289, lng: -46.6997 } },
    { id: 2, name: 'Seu Sofá', status: 'completed', location: 'VILA ROMANA', coordinates: { lat: -23.5342, lng: -46.6895 } },
    { id: 3, name: 'BMW Motorrad Grand Brasil', status: 'pending', location: 'VILA LEOPOLDINA', coordinates: { lat: -23.5395, lng: -46.7050 } },
    { id: 4, name: 'Mobly Megastore', status: 'pending', location: 'VILA YARA', coordinates: { lat: -23.5510, lng: -46.7180 } },
    { id: 5, name: 'O Boticário', status: 'pending', location: 'JAGUARÉ', coordinates: { lat: -23.5450, lng: -46.7089 } }
  ]);

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

    // Coordenadas centradas na região das paradas
    const localizacaoPadrao = { lat: -23.5405, lng: -46.7050 };
    
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
      zoom: 12,
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

    // Adicionar marcadores para cada parada
    stops.forEach((stop, index) => {
      if (stop.coordinates) {
        const posicao = {
          lat: stop.coordinates.lat,
          lng: stop.coordinates.lng
        };

        // Criar um marcador personalizado mais bonito
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

    // Ajustar o zoom para mostrar todos os marcadores
    const bounds = new window.google.maps.LatLngBounds();
    stops.forEach(stop => {
      if (stop.coordinates) {
        bounds.extend(new window.google.maps.LatLng(
          stop.coordinates.lat,
          stop.coordinates.lng
        ));
      }
    });
    mapa.fitBounds(bounds);
  };

  // Carregar o script do Google Maps quando o componente for montado
  useEffect(() => {
    carregarGoogleMapsScript();
    
    return () => {
      // O Google Maps gerencia seus próprios recursos
    };
  }, []);

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
      <div className="rotas-header">
        <div className="rotas-header__left">
          <button className="btn-back" onClick={onBack}>
            ← Voltar
          </button>
          <h1 className="rotas-title">Rotas</h1>
        </div>
        <div className="rotas-header__right">
          <span className="rotas-user">Ronaldo</span>
          <span className="rotas-date">16/07/2025</span>
        </div>
      </div>

      <div className="rotas-content">
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
            
            <div className="rotas-driver-info">
              <div className="rotas-avatar">👤</div>
              <div className="rotas-driver-details">
                <h3>Pedro Henrique VICENTE Duarte</h3>
                <div className="rotas-driver-meta">
                  <div className="meta-item">
                    <span className="meta-label">Caminhão:</span>
                    <span className="meta-value">QWEO-3470</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Status:</span>
                    <span className="tag tag-active">Atrasada</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rotas-delivery-info">
              <div className="info-row">
                <span className="info-label">Destino:</span>
                <span className="info-value">Av. dos Autonomistas, 1400 - Vila Yara, Osasco - SP, 06020-010</span>
              </div>
              <div className="info-row">
                <span className="info-label">Número de Entrega:</span>
                <span className="info-value">#{deliveryId || '0001'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Conteúdo da Entrega:</span>
                <span className="info-value">Jogos de Videogame</span>
              </div>
              <div className="info-row">
                <span className="info-label">Chegada Prevista:</span>
                <span className="info-value">DD/MM/YYYY</span>
              </div>
              <div className="info-row">
                <span className="info-label">Tempo Estimado:</span>
                <span className="info-value">DD/MM/YYYY - HH/MM/SS</span>
              </div>
            </div>
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