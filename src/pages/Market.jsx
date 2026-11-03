import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ApiService } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Market() {
  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('All');
  const [category, setCategory] = useState('All');
  
  const [commodities, setCommodities] = useState([]);
  const [dateStr, setDateStr] = useState('');
  
  // Selected Crop for Chart
  const [selectedCrop, setSelectedCrop] = useState({
    name: 'Tomato',
    district: 'Thrissur',
    price: '₹42/kg',
    change: '+4%',
    trend: 'up'
  });

  const [chartDataState, setChartDataState] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"],
    datasets: [
      {
        fill: true,
        label: 'Price (₹/kg)',
        data: [38, 39, 39.5, 41, 40, 41.5, 42],
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        tension: 0.3
      }
    ]
  });

  const [insightText, setInsightText] = useState('Tomato rates in Thrissur have increased by 4% due to higher monsoon logistics demand.');

  useEffect(() => {
    let isCurrent = true;
    ApiService.getMarketPrices(district, category, search).then((data) => {
      if (!isCurrent) return;
      const list = data?.prices || data?.data || (Array.isArray(data) ? data : []);
      setCommodities(list);
      if (data?.date) setDateStr(data.date);

      // Auto-update chart with top commodity for the selected district if current crop isn't in list
      if (list.length > 0) {
        const stillInList = list.some(item => (item.crop || '').toLowerCase().includes(selectedCrop.name.toLowerCase()));
        if (!stillInList) {
          handleSelectCrop(list[0]);
        }
      }
    });
    return () => { isCurrent = false; };
  }, [district, category, search]);

  const handleSelectCrop = async (item) => {
    const rawCropName = item.crop.split('(')[0].trim();
    setSelectedCrop({
      name: rawCropName,
      district: item.district,
      price: `₹${item.price}/${item.unit}`,
      change: item.change,
      trend: item.trend
    });

    const chartRes = await ApiService.getMarketChart(rawCropName, item.district);
    if (chartRes?.prices) {
      setChartDataState({
        labels: chartRes.labels || ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Today"],
        datasets: [
          {
            fill: true,
            label: `${rawCropName} (₹/${item.unit})`,
            data: chartRes.prices,
            borderColor: item.trend === 'down' ? '#d32f2f' : '#2e7d32',
            backgroundColor: item.trend === 'down' ? 'rgba(211, 47, 47, 0.12)' : 'rgba(46, 125, 50, 0.12)',
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: item.trend === 'down' ? '#d32f2f' : '#2e7d32'
          }
        ]
      });
      if (chartRes.insight) setInsightText(chartRes.insight);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` Rate: ₹${context.parsed.y}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0,0,0,0.06)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="text-center max-w-700 mx-auto mb-4">
        <h1 className="display-6 fw-bold page-header-title mb-2">{t('marketPageTitle', 'Market Price Insights')}</h1>
        <p className="page-header-subtitle fs-5 text-muted">
          {t('marketSubtitle', 'Live agricultural commodity rates across all Kerala wholesale markets & commodity boards')}
        </p>
      </div>

      {/* Quick Stats Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="vibrant-card-green p-3 text-center h-100">
            <div className="vibrant-icon-circle mb-1"><i className="fa-solid fa-seedling"></i></div>
            <div className="vibrant-label text-muted small">{t('totalTracked', 'Tracked Crops')}</div>
            <div className="vibrant-val fs-4 fw-bold">50+ Crops</div>
            <span className="badge bg-white text-success border shadow-xs mt-1">All Kerala Mandis</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="vibrant-card-amber p-3 text-center h-100">
            <div className="vibrant-icon-circle mb-1"><i className="fa-solid fa-location-dot"></i></div>
            <div className="vibrant-label text-muted small">{t('activeMandis', 'Coverage')}</div>
            <div className="vibrant-val fs-4 fw-bold">14 Districts</div>
            <span className="badge bg-white text-dark border shadow-xs mt-1">Statewide Mandis</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="vibrant-card-teal p-3 text-center h-100">
            <div className="vibrant-icon-circle mb-1"><i className="fa-solid fa-arrow-trend-up"></i></div>
            <div className="vibrant-label text-muted small">Top Gainer</div>
            <div className="vibrant-val fs-4 fw-bold">+10%</div>
            <span className="badge bg-white text-dark border shadow-xs mt-1">Kanthari Chilli</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="vibrant-card-blue p-3 text-center h-100">
            <div className="vibrant-icon-circle mb-1"><i className="fa-solid fa-scale-balanced"></i></div>
            <div className="vibrant-label text-muted small">Govt MSP</div>
            <div className="vibrant-val fs-4 fw-bold">₹28.20/kg</div>
            <span className="badge bg-white text-primary border shadow-xs mt-1">Paddy MSP Base</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="km-card mb-4 shadow-sm">
        <div className="row g-3 align-items-center mb-3">
          <div className="col-md-7">
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="fa-solid fa-magnifying-glass text-success"></i></span>
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder={t('searchCrop', 'Search any Kerala crop (e.g. Tea, Coffee, Rubber, Pepper, Banana, Coconut, Rice)...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="btn btn-outline-secondary" type="button" onClick={() => setSearch('')}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="fa-solid fa-location-dot text-success"></i></span>
              <select
                className="form-select form-select-lg"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="All">{t('allDistricts', 'All Kerala Markets (14 Districts)')}</option>
                {['Thrissur', 'Ernakulam', 'Palakkad', 'Wayanad', 'Idukki', 'Kottayam', 'Kozhikode', 'Alappuzha', 'Thiruvananthapuram', 'Kollam', 'Malappuram', 'Kannur', 'Kasaragod', 'Pathanamthitta'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Pills with horizontal touch scroll */}
        <div className="market-cat-pills-bar pt-2 border-top">
          {[
            { id: 'All', label: t('allCategories', 'All Crops (50+)') },
            { id: 'Plantation', label: t('catPlantation', '☕ Plantation & Cash Crops') },
            { id: 'Spices', label: t('catSpices', '🌿 Spices & Condiments') },
            { id: 'Fruits', label: t('catFruits', '🍌 Fruits & Bananas') },
            { id: 'Vegetables', label: t('catVegetables', '🥕 Vegetables & Greens') },
            { id: 'Tubers', label: t('catTubersGrains', '🌾 Grains & Tubers') }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`btn btn-sm market-cat-pill ${category === cat.id ? 'btn-km-primary active' : 'btn-outline-success'}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="row g-4">
        {/* Market Rates Table */}
        <div className="col-lg-7">
          <div className="km-card shadow-sm h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div>
                <h2 className="h5 fw-bold mb-0 text-primary-dark">
                  <i className="fa-solid fa-store text-success me-2"></i>Live Market Rates
                </h2>
                <div className="small text-muted mt-1">
                  <span className="badge bg-success-subtle text-success border border-success me-2">
                    <i className="fa-solid fa-signal text-success me-1"></i>Daily Mandi Sync
                  </span>
                  <span>{dateStr || new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <span className="badge bg-light text-dark border">{commodities.length} Commodities</span>
            </div>

            <div className="table-responsive" style={{ maxHeight: '520px', overflowY: 'auto' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th scope="col">{t('cropCol', 'Crop & Variety')}</th>
                    <th scope="col">{t('marketCol', 'Market / District')}</th>
                    <th scope="col">{t('priceCol', 'Price')}</th>
                    <th scope="col">{t('trendCol', '7-Day Trend')}</th>
                  </tr>
                </thead>
                <tbody>
                  {commodities.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleSelectCrop(item)}
                      style={{ cursor: 'pointer' }}
                      className={selectedCrop.name.toLowerCase() === item.crop.toLowerCase().split('(')[0].trim() ? 'table-success' : ''}
                    >
                      <td>
                        <strong className="d-block text-dark">{item.crop}</strong>
                        <small className="text-muted">{item.variety}</small>
                      </td>
                      <td>
                        <div className="fw-medium text-dark">{item.market}</div>
                        <small className="badge bg-light text-secondary border">{item.district}</small>
                      </td>
                      <td>
                        <span className="fs-6 fw-bold text-success">₹{item.price}</span>
                        <small className="text-muted">/{item.unit}</small>
                      </td>
                      <td>
                        <span className={`badge ${item.trend === 'up' ? 'bg-success-subtle text-success border border-success' : item.trend === 'down' ? 'bg-danger-subtle text-danger border border-danger' : 'bg-secondary-subtle text-secondary'}`}>
                          <i className={`fa-solid ${item.trend === 'up' ? 'fa-arrow-trend-up' : item.trend === 'down' ? 'fa-arrow-trend-down' : 'fa-minus'} me-1`}></i>
                          {item.change}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {commodities.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">
                        No crops found matching "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-2 text-center text-muted small border-top">
              <i className="fa-solid fa-hand-pointer me-1"></i> Click on any row to view price trend graph & market insight
            </div>
          </div>
        </div>

        {/* Chart.js Visualizer Card */}
        <div className="col-lg-5">
          <div className="km-card shadow-sm h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h2 className="h5 fw-bold mb-0 text-primary-dark">{t('chartTitle', 'Live Price Trend & Analysis')}</h2>
              <span className="badge bg-success">{selectedCrop.name}</span>
            </div>

            <div className="mb-2">
              <span className="fs-3 fw-bold text-success">{selectedCrop.price}</span>
              <span className={`badge ms-2 ${selectedCrop.trend === 'up' ? 'bg-success' : selectedCrop.trend === 'down' ? 'bg-danger' : 'bg-secondary'}`}>
                {selectedCrop.change}
              </span>
              <div className="small text-muted">{selectedCrop.district} Mandi Wholesale Auction</div>
            </div>

            <div className="p-2 flex-grow-1" style={{ minHeight: '260px', position: 'relative' }}>
              <Line data={chartDataState} options={chartOptions} />
            </div>

            <div className="p-3 bg-light rounded border text-secondary small mt-3">
              <i className="fa-solid fa-chart-line text-success me-1"></i>
              <span>{insightText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
