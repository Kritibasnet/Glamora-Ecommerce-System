import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';

// Fix for marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onLocationSelect(lat, lng);
        },
    });
    return null;
};

const DeliveryMap = ({ latitude, longitude, onLocationSelect, city = 'Kathmandu', onAddressChange }) => {
    const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]); // Default to Kathmandu
    const [markerPosition, setMarkerPosition] = useState(null);
    const [addressName, setAddressName] = useState('');
    const [loadingAddress, setLoadingAddress] = useState(false);

    // Reverse geocoding function to get address from coordinates
    const getAddressFromCoordinates = async (lat, lng) => {
        setLoadingAddress(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            
            // Extract useful address components
            const address = data.address;
            let locationName = '';
            
            // Try to get the most specific location name
            if (address.neighbourhood) {
                locationName = address.neighbourhood;
            } else if (address.suburb) {
                locationName = address.suburb;
            } else if (address.village) {
                locationName = address.village;
            } else if (address.town) {
                locationName = address.town;
            } else if (address.city) {
                locationName = address.city;
            } else if (address.district) {
                locationName = address.district;
            } else {
                locationName = address.road ? `${address.road}` : 'Unknown Location';
            }
            
            setAddressName(locationName);
            
            // Return address data for auto-filling form
            return {
                location: locationName,
                city: address.city || address.town || address.district || '',
                country: address.country || '',
                postCode: address.postcode || ''
            };
        } catch (error) {
            console.log('Geocoding error:', error);
            setAddressName('Unable to fetch address');
            return null;
        } finally {
            setLoadingAddress(false);
        }
    };

    useEffect(() => {
        if (latitude && longitude) {
            setMarkerPosition([latitude, longitude]);
            setMapCenter([latitude, longitude]);
            getAddressFromCoordinates(latitude, longitude);
        } else {
            // Try to center based on city
            const cityCenters = {
                'kathmandu': [27.7172, 85.3240],
                'pokhara': [28.2096, 83.9856],
                'bhaktapur': [27.6720, 85.4197],
                'lalitpur': [27.6408, 85.3289],
            };
            const cityKey = city.toLowerCase();
            if (cityCenters[cityKey]) {
                setMapCenter(cityCenters[cityKey]);
            }
        }
    }, [latitude, longitude, city]);

    const handleLocationSelect = (lat, lng) => {
        setMarkerPosition([lat, lng]);
        onLocationSelect(lat, lng);
        // Get address and auto-fill form if callback is provided
        getAddressFromCoordinates(lat, lng).then(addressData => {
            if (addressData && onAddressChange) {
                onAddressChange(addressData);
            }
        });
    };

    return (
        <MapWrapper>
            <div className="map-container">
                <div className="map-info">
                    <p className="instruction-text">
                        📍 <strong>Click on the map</strong> to pinpoint your delivery location
                    </p>
                </div>
                <MapContainer
                    center={mapCenter}
                    zoom={15}
                    style={{ height: '400px', width: '100%' }}
                    className="leaflet-container"
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onLocationSelect={handleLocationSelect} />
                    {markerPosition && (
                        <Marker position={markerPosition}>
                            <Popup>
                                <div>
                                    <strong>Delivery Location</strong>
                                    <p><strong>{addressName}</strong></p>
                                    <p style={{ fontSize: '12px', margin: '4px 0' }}>Lat: {markerPosition[0].toFixed(6)}</p>
                                    <p style={{ fontSize: '12px', margin: '4px 0' }}>Lng: {markerPosition[1].toFixed(6)}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
                {markerPosition && (
                    <div className="coordinates-display">
                        <p>📍 Selected Location:</p>
                        {loadingAddress ? (
                            <p className="coords" style={{ fontStyle: 'italic', color: '#666' }}>
                                Loading address...
                            </p>
                        ) : (
                            <>
                                <p className="address-name">
                                    <strong>{addressName}</strong>
                                </p>
                                <p className="coords">
                                    Lat: <strong>{markerPosition[0].toFixed(6)}</strong>, 
                                    Lng: <strong>{markerPosition[1].toFixed(6)}</strong>
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </MapWrapper>
    );
};

export default DeliveryMap;

const MapWrapper = styled.div`
    .map-container {
        background: #f8f9fa;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .map-info {
        background: var(--mainPink, #d45e7d);
        color: white;
        padding: 12px 16px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .instruction-text {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .leaflet-container {
        border-radius: 0;
        z-index: 1;
    }

    .coordinates-display {
        background: #e8f4f8;
        padding: 12px 16px;
        border-top: 1px solid #d0e8f2;
        font-size: 13px;
        color: #333;
        border-radius: 0 0 8px 8px;

        p {
            margin: 4px 0;
        }

        .address-name {
            font-size: 15px;
            color: var(--mainPink, #d45e7d);
            margin-bottom: 8px !important;
            word-break: break-word;
        }

        .coords {
            font-weight: 500;
            color: var(--mainPink, #d45e7d);
            font-size: 12px;
        }
    }

    @media (max-width: 768px) {
        .leaflet-container {
            height: 300px !important;
        }
    }
`;
