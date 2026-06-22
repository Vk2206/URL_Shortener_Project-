import React, { useState, useEffect } from 'react'
import {
  Link2,
  BarChart3,
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Clock,
  Calendar,
  Globe,
  Compass,
  Laptop,
  AlertCircle,
  RefreshCw,
  Search,
  QrCode
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'

const API_BASE = 'http://localhost:8080'
const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#ec4899', '#eab308']

function App() {
  const [activeTab, setActiveTab] = useState('shorten')
  
  // Shortener Form States
  const [longUrl, setLongUrl] = useState('')
  const [customKey, setCustomKey] = useState('')
  const [expirationMinutes, setExpirationMinutes] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loadingShorten, setLoadingShorten] = useState(false)
  const [shortenError, setShortenError] = useState('')
  const [shortenedResult, setShortenedResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)

  // Directory and Analytics States
  const [urls, setUrls] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingUrls, setLoadingUrls] = useState(false)
  const [selectedUrlKey, setSelectedUrlKey] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')

  // Load all URLs on mount or when directory tab becomes active
  useEffect(() => {
    fetchUrls()
  }, [])

  // Auto-refresh analytics when selected URL changes
  useEffect(() => {
    if (selectedUrlKey) {
      fetchAnalytics(selectedUrlKey)
    } else {
      setAnalyticsData(null)
    }
  }, [selectedUrlKey])

  const fetchUrls = async () => {
    setLoadingUrls(true)
    try {
      const res = await fetch(`${API_BASE}/api/urls`)
      if (res.ok) {
        const data = await res.json()
        // Sort by creation date descending
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setUrls(data)
      }
    } catch (err) {
      console.error("Failed to fetch URLs", err)
    } finally {
      setLoadingUrls(false)
    }
  }

  const handleShorten = async (e) => {
    e.preventDefault()
    if (!longUrl) return

    setLoadingShorten(true)
    setShortenError('')
    setShortenedResult(null)
    setShowQr(false)

    try {
      const payload = {
        longUrl,
        customKey: customKey ? customKey.trim() : null,
        expirationMinutes: expirationMinutes ? parseInt(expirationMinutes) : null
      }

      const res = await fetch(`${API_BASE}/api/urls/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to shorten URL')
      }

      setShortenedResult(data)
      setLongUrl('')
      setCustomKey('')
      setExpirationMinutes('')
      setShowAdvanced(false)
      fetchUrls() // refresh listing
    } catch (err) {
      setShortenError(err.message)
    } finally {
      setLoadingShorten(false)
    }
  }

  const fetchAnalytics = async (shortKey) => {
    setLoadingAnalytics(true)
    setAnalyticsError('')
    try {
      const res = await fetch(`${API_BASE}/api/urls/analytics/${shortKey}`)
      if (!res.ok) {
        throw new Error('Could not load analytics for this URL.')
      }
      const data = await res.json()
      setAnalyticsData(data)
    } catch (err) {
      setAnalyticsError(err.message)
      setAnalyticsData(null)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const handleDeleteUrl = async (shortKey, e) => {
    e.stopPropagation() // prevent select
    if (!window.confirm(`Are you sure you want to delete short URL "${shortKey}"?`)) return

    try {
      const res = await fetch(`${API_BASE}/api/urls/${shortKey}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        if (selectedUrlKey === shortKey) {
          setSelectedUrlKey(null)
          setAnalyticsData(null)
        }
        fetchUrls()
      }
    } catch (err) {
      console.error("Failed to delete URL", err)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAtStr) => {
    if (!expiresAtStr) return false
    return new Date(expiresAtStr) < new Date()
  }

  // Filtered URLs based on search query
  const filteredUrls = urls.filter(u => 
    u.shortKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.longUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.title && u.title.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const selectedUrlObject = urls.find(u => u.shortKey === selectedUrlKey)

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="header glass-card">
        <div className="logo">
          <Link2 size={28} style={{ color: 'var(--color-primary)' }} />
          Veloce<span>Link</span>
        </div>
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'shorten' ? 'active' : ''}`}
            onClick={() => setActiveTab('shorten')}
          >
            <PlusCircle size={16} /> Shorten URL
          </button>
          <button 
            className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('analytics')
              fetchUrls()
            }}
          >
            <BarChart3 size={16} /> Analytics & History
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* TAB 1: SHORTENER */}
        {activeTab === 'shorten' && (
          <div className="shortener-grid">
            
            {/* Shortener Input Card */}
            <div className="glass-card shortener-card">
              <h1 className="shortener-title">Shorten Your Destination</h1>
              <p className="shortener-subtitle">Create fast, trackable, and beautiful short links in seconds.</p>
              
              {shortenError && (
                <div className="error-banner">
                  <AlertCircle size={18} />
                  <span>{shortenError}</span>
                </div>
              )}

              <form onSubmit={handleShorten}>
                <div className="form-group">
                  <label className="form-label">Destination URL</label>
                  <input 
                    type="text"
                    className="input-field"
                    placeholder="https://example.com/very/long/url/path..."
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="button" 
                  className="advanced-toggle"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options (Alias, Expiry)'}
                </button>

                {showAdvanced && (
                  <div className="advanced-options">
                    <div className="form-group">
                      <label className="form-label">Custom Alias (Optional)</label>
                      <input 
                        type="text"
                        className="input-field"
                        placeholder="e.g. spring-promo"
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Expiration Timer (Minutes from now, Optional)</label>
                      <input 
                        type="number"
                        min="1"
                        className="input-field"
                        placeholder="e.g. 60 for 1 hour"
                        value={expirationMinutes}
                        onChange={(e) => setExpirationMinutes(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn" 
                  disabled={loadingShorten}
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  {loadingShorten ? (
                    <>
                      <RefreshCw className="spinner" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Shortening Link...
                    </>
                  ) : 'Shorten Link'}
                </button>
              </form>
            </div>

            {/* Information / Result Column */}
            <div className="result-column">
              {shortenedResult ? (
                <div className="glass-card result-card">
                  <div className="result-header">
                    <Check size={20} />
                    <span>URL Shortened Successfully!</span>
                  </div>
                  
                  <div>
                    <span className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Page Title</span>
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>{shortenedResult.title || 'No Title Scraped'}</strong>
                  </div>

                  <div>
                    <span className="form-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Shortened Link</span>
                    <div className="result-url-wrapper">
                      <span className="result-url">{shortenedResult.shortUrl}</span>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => copyToClipboard(shortenedResult.shortUrl)}
                        style={{ padding: '0.5rem 0.75rem' }}
                      >
                        {copied ? <Check size={16} style={{ color: 'var(--color-success)' }} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="result-actions">
                    <a 
                      href={shortenedResult.shortUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn"
                      style={{ flex: 1 }}
                    >
                      <ExternalLink size={16} /> Open Link
                    </a>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setShowQr(!showQr)}
                      style={{ flex: 1 }}
                    >
                      <QrCode size={16} /> {showQr ? 'Hide QR' : 'Show QR'}
                    </button>
                  </div>

                  {showQr && (
                    <div className="qr-container">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortenedResult.shortUrl)}`} 
                        alt="Short URL QR Code" 
                        className="qr-image" 
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scan to visit shortened link</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '2.25rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>Core System Capabilities</h3>
                  <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
                    <li style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--color-primary)' }}>✦</span>
                      <span><strong>Auto Title Scraping</strong>: We fetch the HTML page title of your destination automatically to keep links organized.</span>
                    </li>
                    <li style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--color-accent)' }}>✦</span>
                      <span><strong>Custom Alias Key</strong>: Create highly descriptive promo URLs instead of random keys.</span>
                    </li>
                    <li style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--color-success)' }}>✦</span>
                      <span><strong>Dynamic Expiry Controls</strong>: Limit redirect lifespans for time-sensitive marketing codes.</span>
                    </li>
                    <li style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--color-primary)' }}>✦</span>
                      <span><strong>Rich Click Analytics</strong>: Track browsers, systems, referrers, and countries in real-time.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS & DIRECTORY */}
        {activeTab === 'analytics' && (
          <div className="dashboard-grid">
            
            {/* Metric Overview Row */}
            <div className="metrics-row">
              <div className="glass-card metric-card">
                <div className="metric-icon-wrapper">
                  <Link2 size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Total Links</span>
                  <span className="metric-value">{urls.length}</span>
                </div>
              </div>

              <div className="glass-card metric-card">
                <div className="metric-icon-wrapper">
                  <BarChart3 size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Total Traffic</span>
                  <span className="metric-value">
                    {urls.reduce((acc, curr) => acc + curr.clickCount, 0)}
                  </span>
                </div>
              </div>

              <div className="glass-card metric-card">
                <div className="metric-icon-wrapper">
                  <Clock size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Active Links</span>
                  <span className="metric-value">
                    {urls.filter(u => !isExpired(u.expiresAt)).length}
                  </span>
                </div>
              </div>
            </div>

            {/* List and Details Layout */}
            <div className="details-grid">
              
              {/* Directory Left Column */}
              <div className="glass-card table-card">
                <div className="table-header-row">
                  <h3 className="table-title">URL Directory</h3>
                  
                  {/* Search box */}
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Search URLs..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '2rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {loadingUrls ? (
                  <div className="empty-state">
                    <RefreshCw className="spinner" size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Loading URL mappings...</span>
                  </div>
                ) : filteredUrls.length === 0 ? (
                  <div className="empty-state">
                    <AlertCircle className="empty-state-icon" />
                    <span>No URLs found. Shorten one first!</span>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Link Title</th>
                          <th>Short Code</th>
                          <th>Clicks</th>
                          <th>Expiry Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUrls.map((url) => (
                          <tr 
                            key={url.shortKey}
                            className={selectedUrlKey === url.shortKey ? 'selected' : ''}
                            onClick={() => setSelectedUrlKey(url.shortKey)}
                          >
                            <td>
                              <div className="long-url-cell" style={{ fontWeight: 600, color: '#fff' }}>
                                {url.title || 'Untitled Link'}
                              </div>
                              <div className="long-url-cell" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {url.longUrl}
                              </div>
                            </td>
                            <td>
                              <span className="short-key-badge">{url.shortKey}</span>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                              {url.clickCount}
                            </td>
                            <td>
                              {url.expiresAt ? (
                                isExpired(url.expiresAt) ? (
                                  <span className="expiry-cell expiry-expired">Expired</span>
                                ) : (
                                  <span className="expiry-cell expiry-active">Active</span>
                                )
                              ) : (
                                <span className="expiry-cell">Permanent</span>
                              )}
                            </td>
                            <td>
                              <button 
                                className="btn btn-secondary btn-danger"
                                onClick={(e) => handleDeleteUrl(url.shortKey, e)}
                                style={{ padding: '0.4rem 0.6rem' }}
                                title="Delete URL"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Analytics Details Right Column */}
              <div className="analytics-panel">
                {selectedUrlKey ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Header info */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link2 size={18} style={{ color: 'var(--color-accent)' }} /> 
                        {selectedUrlObject?.title || 'Selected URL Details'}
                      </h3>
                      
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <p style={{ wordBreak: 'break-all' }}>
                          <strong>Dest:</strong> <a href={selectedUrlObject?.longUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>{selectedUrlObject?.longUrl}</a>
                        </p>
                        <p>
                          <strong>Short:</strong> <a href={selectedUrlObject?.shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>{selectedUrlObject?.shortUrl}</a>
                        </p>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                          <Calendar size={14} /> Created: {formatDate(selectedUrlObject?.createdAt)}
                        </p>
                        {selectedUrlObject?.expiresAt && (
                          <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={14} /> Expiry: {formatDate(selectedUrlObject?.expiresAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Loading State for Analytics */}
                    {loadingAnalytics ? (
                      <div className="glass-card empty-state" style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                        <RefreshCw className="spinner" size={24} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Compiling analytics reports...</span>
                      </div>
                    ) : analyticsError ? (
                      <div className="glass-card error-banner">
                        <AlertCircle size={18} />
                        <span>{analyticsError}</span>
                      </div>
                    ) : analyticsData ? (
                      <>
                        {/* Traffic Timeline Chart */}
                        <div className="glass-card chart-card">
                          <h4 className="chart-title">
                            <Calendar size={16} /> Click History Over Time
                          </h4>
                          <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={analyticsData.clicksOverTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                                <Tooltip 
                                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }} 
                                  labelStyle={{ color: '#fff', fontWeight: 600 }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="clicks" 
                                  stroke="var(--color-primary)" 
                                  strokeWidth={3} 
                                  dot={{ fill: 'var(--color-primary)', strokeWidth: 2 }}
                                  activeDot={{ r: 6, fill: 'var(--color-accent)' }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Top Channels Subgrid */}
                        <div className="charts-subgrid">
                          
                          {/* Referrers */}
                          <div className="glass-card mini-chart-card">
                            <h4 className="chart-title" style={{ fontSize: '0.95rem' }}>
                              <Globe size={14} /> Referral Channels
                            </h4>
                            {analyticsData.referrers.length === 0 ? (
                              <div className="empty-state" style={{ padding: '1rem', height: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
                                No referrer data yet
                              </div>
                            ) : (
                              <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={analyticsData.referrers}>
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                                    <YAxis stroke="var(--text-muted)" fontSize={10} allowDecimals={false} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }} />
                                    <Bar dataKey="value" fill="var(--color-accent)" radius={[4, 4, 0, 0]}>
                                      {analyticsData.referrers.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>

                          {/* Country */}
                          <div className="glass-card mini-chart-card">
                            <h4 className="chart-title" style={{ fontSize: '0.95rem' }}>
                              <Globe size={14} /> Visitor Regions
                            </h4>
                            {analyticsData.countries.length === 0 ? (
                              <div className="empty-state" style={{ padding: '1rem', height: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
                                No country data yet
                              </div>
                            ) : (
                              <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={analyticsData.countries}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={35}
                                      outerRadius={55}
                                      paddingAngle={3}
                                      dataKey="value"
                                    >
                                      {analyticsData.countries.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>

                          {/* Browsers */}
                          <div className="glass-card mini-chart-card">
                            <h4 className="chart-title" style={{ fontSize: '0.95rem' }}>
                              <Compass size={14} /> Browsers Used
                            </h4>
                            {analyticsData.browsers.length === 0 ? (
                              <div className="empty-state" style={{ padding: '1rem', height: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
                                No browser data yet
                              </div>
                            ) : (
                              <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={analyticsData.browsers}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={35}
                                      outerRadius={55}
                                      paddingAngle={3}
                                      dataKey="value"
                                    >
                                      {analyticsData.browsers.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }} />
                                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>

                          {/* OS */}
                          <div className="glass-card mini-chart-card">
                            <h4 className="chart-title" style={{ fontSize: '0.95rem' }}>
                              <Laptop size={14} /> OS Platforms
                            </h4>
                            {analyticsData.operatingSystems.length === 0 ? (
                              <div className="empty-state" style={{ padding: '1rem', height: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
                                No platform data yet
                              </div>
                            ) : (
                              <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={analyticsData.operatingSystems}>
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                                    <YAxis stroke="var(--text-muted)" fontSize={10} allowDecimals={false} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }} />
                                    <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]}>
                                      {analyticsData.operatingSystems.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>

                        </div>
                      </>
                    ) : null}

                  </div>
                ) : (
                  <div className="glass-card empty-state" style={{ height: '350px', justifyContent: 'center' }}>
                    <BarChart3 className="empty-state-icon" style={{ opacity: 0.5 }} />
                    <h4 style={{ color: '#fff', fontSize: '1.1rem' }}>No URL Selected</h4>
                    <p style={{ fontSize: '0.875rem', maxWidth: '280px', margin: '0 auto' }}>
                      Select a row from the URL Directory to view click timelines, visitor origins, and device details.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Styled Footer */}
      <footer className="footer">
        <p>VeloceLink URL Shortener Dashboard © 2026. Made with ❤️ and Spring Boot, MySQL, and React.</p>
        <p style={{ marginTop: '0.35rem' }}>
          Backend API status: <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>● Online</span> | Standard port: 8080
        </p>
      </footer>
    </div>
  )
}

export default App
