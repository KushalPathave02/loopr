import React, { useEffect, useState } from 'react';
import { useCurrency } from '../CurrencyContext';
import DashboardLayout from '../components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import LineChartInfographic from '../components/LineChartInfographic';
import { getMonthlyRevenueExpenses } from '../components/LineChartInfographicData';
import { TextField, MenuItem, IconButton, Button, Menu, MenuItem as MuiMenuItem, ToggleButtonGroup, ToggleButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme } from '@mui/material/styles';

interface Transaction {
  _id: string;
  date: string;
  amount: number;
  category: string;
  status: string;
  [key: string]: any;
}

const Dashboard: React.FC = () => {
  const { currency } = useCurrency();
  const theme = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [amountMin, setAmountMin] = useState<string>('');
  const [amountMax, setAmountMax] = useState<string>('');

  const [page, setPage] = useState(1);
  const rowsPerPage = 8;
  const [sortBy, setSortBy] = useState<'date'|'amount'|'category'|'status'>('date');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  // --- Currency Formatting ---
  const formatCurrency = (amount: number) => {
    if (currency === 'INR') return `₹${amount.toLocaleString('en-IN')}`;
    if (currency === 'USD') return `$${amount.toLocaleString('en-US')}`;
    if (currency === 'EUR') return `€${amount.toLocaleString('en-EU')}`;
    return `${amount}`;
  };
  // --- Graph Filter State ---
  const [graphFilterAnchor, setGraphFilterAnchor] = useState<null | HTMLElement>(null);
  const [graphCategoryFilter, setGraphCategoryFilter] = useState('');
  const [graphStatusFilter, setGraphStatusFilter] = useState('');
  const [graphFilterType, setGraphFilterType] = useState<'all' | 'category' | 'status'>('all');

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL;
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      if (!API_URL) {
        setError('API URL not set. Please configure REACT_APP_API_URL in your .env file.');
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/transactions?page=1&pageSize=10000`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        } else {
          setError(data.message || 'Failed to fetch transactions');
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  // --- Improved Personal Finance Summary Calculations ---
  // Set previous balance (can be made dynamic or user-input)
  const previousBalance = 0; // Set to 0 if first month, or replace with actual previous balance
  const count = transactions.length;
  // Define expense categories
  const expenseCategories = [
    'rent','bills','groceries','travel','others','shopping','food','utilities','transport','medical',
    'entertainment','subscriptions','education','emi','loan','insurance','tax','fuel','misc','expense'
  ];
  const isExpense = (t: Transaction) =>
    expenseCategories.includes((t.category || '').toLowerCase()) || (t.type?.toLowerCase() === 'expense');
  // Expenses: sum all transactions in expense categories
  const expenses = transactions.reduce((sum, t) => isExpense(t) ? sum + (t.amount || 0) : sum, 0);
  // Revenue: sum all transactions NOT in expense categories
  const revenue = transactions.reduce((sum, t) => !isExpense(t) ? sum + (t.amount || 0) : sum, 0);
  // Savings: Revenue - Expenses
  const savings = revenue - expenses;
  // Balance: Previous Balance + Revenue - Expenses
  const balance = previousBalance + revenue - expenses;

  // Category totals for chart
  const categoryTotals = Object.values(transactions.reduce((acc, t) => {
    const cat = t.category || 'Other';
    acc[cat] = acc[cat] || 0;
    acc[cat] += t.amount || 0;
    return acc;
  }, {} as Record<string, number>)).length > 0
    ? Object.entries(transactions.reduce((acc, t) => {
        const cat = t.category || 'Other';
        acc[cat] = acc[cat] || 0;
        acc[cat] += t.amount || 0;
        return acc;
      }, {} as Record<string, number>)).map(([category, amount]) => ({ category, amount }))
    : [];

  // Pie chart data for income/expenses
  const pieData = [
    { name: 'Revenue', value: revenue },
    { name: 'Expenses', value: Math.abs(expenses) }
  ];
  const pieColors = ['#7c3aed', '#ff5c8a'];

  // Filters
  const categories = Array.from(new Set(transactions.map(t => t.category))).filter(Boolean);
  const statuses = Array.from(new Set(transactions.map(t => t.status))).filter(Boolean);

  // Filtered, searched, sorted, paginated data
  let filtered = transactions.filter(t =>
    (!categoryFilter || t.category === categoryFilter) &&
    (!statusFilter || t.status === statusFilter) &&
    (!search || t.category?.toLowerCase().includes(search.toLowerCase()) || t.status?.toLowerCase().includes(search.toLowerCase())) &&
    (!dateFrom || new Date(t.date) >= new Date(dateFrom)) &&
    (!dateTo || new Date(t.date) <= new Date(dateTo)) &&
    (!amountMin || t.amount >= parseFloat(amountMin)) &&
    (!amountMax || t.amount <= parseFloat(amountMax))
  );
  filtered = filtered.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'amount') cmp = (a.amount - b.amount);
    else if (sortBy === 'date') cmp = (new Date(a.date).getTime() - new Date(b.date).getTime());
    else cmp = (a[sortBy] || '').localeCompare(b[sortBy] || '');
    return sortDir === 'asc' ? cmp : -cmp;
  });
  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Prepare data for line chart (filtered by graph filter)
  const filteredGraphTxns = transactions.filter(t =>
    (!graphCategoryFilter || t.category === graphCategoryFilter) &&
    (!graphStatusFilter || t.status === graphStatusFilter)
  );
  const monthlyLineData = getMonthlyRevenueExpenses(filteredGraphTxns);

  return (
    <DashboardLayout>
      <h2 style={{ marginBottom: 16 }}>Dashboard</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (
        <>
          {/* Revenue & Expenses Line Chart */}
          <div style={{ marginBottom: 0 }}>
            <LineChartInfographic data={monthlyLineData} />
          </div>
          {/* Graph Filters below the chart */}
          <div style={{ display: 'flex', gap: 16, margin: '16px 0 36px 0', justifyContent: 'center', alignItems: 'center' }}>
            <TextField
              select
              label="Category Filter"
              value={graphCategoryFilter}
              onChange={e => setGraphCategoryFilter(e.target.value)}
              size="small"
              style={{ minWidth: 160, background: '#181c2a', borderRadius: 6 }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Status Filter"
              value={graphStatusFilter}
              onChange={e => setGraphStatusFilter(e.target.value)}
              size="small"
              style={{ minWidth: 160, background: '#181c2a', borderRadius: 6 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statuses.map(st => <MenuItem key={st} value={st}>{st}</MenuItem>)}
            </TextField>
          </div>
          {/* Summary Cards - Modern, Figma-inspired */}
           <div style={{ display: 'flex', gap: 32, marginBottom: 36, flexWrap: 'wrap', alignItems: 'stretch', justifyContent: 'center' }}>
            {/* Balance */}
            <div
              style={{
                background: 'linear-gradient(90deg, #223b64 0%, #3a8dde 100%)',
                color: '#fff',
                borderRadius: 18,
                padding: '28px 32px',
                boxShadow: '0 4px 24px rgba(44, 62, 80, 0.10)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                minWidth: 260,
                minHeight: 132,
                flex: '0 1 270px',
                maxWidth: 320,
                marginRight: 32
              }}
              className="dashboard-animated-card"
            >
              <span style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span role="img" aria-label="balance">💰</span> Balance
              </span>
              <span style={{ fontSize: 36, fontFamily: 'monospace', fontWeight: 700, marginTop: 12, textAlign: 'left', wordBreak: 'break-all', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${formatCurrency(balance)}</span>
            </div>
            {/* Revenue */}
            <div
              style={{
                background: 'linear-gradient(90deg, #181c2a 0%, #00ffae 100%)',
                color: '#00ffae',
                borderRadius: 18,
                padding: '28px 32px',
                boxShadow: '0 4px 24px rgba(44, 62, 80, 0.10)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                minWidth: 260,
                minHeight: 132,
                flex: '0 1 270px',
                maxWidth: 320,
                marginRight: 32
              }}
              className="dashboard-animated-card"
            >
              <span style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span role="img" aria-label="revenue">🟢</span> Revenue
              </span>
              <span style={{ fontSize: 36, fontFamily: 'monospace', fontWeight: 700, marginTop: 12, textAlign: 'left', wordBreak: 'break-all', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${formatCurrency(revenue)}</span>
            </div>
            {/* Expenses */}
            <div
              style={{
                background: 'linear-gradient(90deg, #181c2a 0%, #ffe066 100%)',
                color: '#ffe066',
                borderRadius: 18,
                padding: '28px 32px',
                boxShadow: '0 4px 24px rgba(44, 62, 80, 0.10)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                minWidth: 260,
                minHeight: 132,
                flex: '0 1 270px',
                maxWidth: 320,
                marginRight: 32
              }}
              className="dashboard-animated-card"
            >
              <span style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span role="img" aria-label="expenses">🟡</span> Expenses
              </span>
              <span style={{ fontSize: 36, fontFamily: 'monospace', fontWeight: 700, marginTop: 12, textAlign: 'left', wordBreak: 'break-all', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${formatCurrency(Math.abs(expenses))}</span>
            </div>
            {/* Savings */}
            <div
              style={{
                background: 'linear-gradient(90deg, #23263a 0%, #7c3aed 100%)',
                color: '#bda6ff',
                borderRadius: 18,
                padding: '28px 32px',
                boxShadow: '0 4px 24px rgba(44, 62, 80, 0.10)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                minWidth: 260,
                minHeight: 132,
                flex: '0 1 270px',
                maxWidth: 320,
                marginRight: 32
              }}
              className="dashboard-animated-card"
            >
              <span style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span role="img" aria-label="savings">💜</span> Savings
              </span>
              <span style={{ fontSize: 36, fontFamily: 'monospace', fontWeight: 700, marginTop: 12, textAlign: 'left', wordBreak: 'break-all', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${formatCurrency(savings)}</span>
            </div>
            {/* Transaction Count */}
            <div
              style={{
                background: 'linear-gradient(90deg, #23263a 0%, #2af598 100%)',
                color: '#2af598',
                borderRadius: 18,
                padding: '28px 32px',
                boxShadow: '0 4px 24px rgba(44, 62, 80, 0.10)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                minWidth: 260,
                minHeight: 132,
                flex: '0 1 270px',
                maxWidth: 320
              }}
              className="dashboard-animated-card"
            >
              <span style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span role="img" aria-label="transactions">🔢</span> Transactions
              </span>
              <span style={{ fontSize: 36, fontFamily: 'monospace', fontWeight: 700, marginTop: 12, textAlign: 'left', wordBreak: 'break-all', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{count}</span>
            </div>
          </div>

          {/* Animation styles for dashboard cards */}
          <style>
            {`
              .dashboard-animated-card {
                opacity: 0;
                transform: translateY(32px) scale(0.96);
                animation: dashboardCardFadeIn 0.75s cubic-bezier(0.39, 0.575, 0.565, 1) forwards;
                will-change: opacity, transform;
                transition: transform 0.18s cubic-bezier(0.39, 0.575, 0.565, 1);
              }
              .dashboard-animated-card:hover {
                transform: translateY(0) scale(1.03);
                box-shadow: 0 8px 32px rgba(44, 62, 80, 0.18);
                z-index: 2;
              }
              @keyframes dashboardCardFadeIn {
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
            `}
          </style>


          {/* Analytics Charts */}
          

          

          {/* Filters and Search */}
           <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            <TextField
              select
              label="Category"
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              size="small"
              style={{ minWidth: 140 }}
            >
              <MenuItem value="">All</MenuItem>
              {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              size="small"
              style={{ minWidth: 140 }}
            >
              <MenuItem value="">All</MenuItem>
              {statuses.map(st => <MenuItem key={st} value={st}>{st}</MenuItem>)}
            </TextField>
            <TextField
              label="Date From"
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                minWidth: 140,
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  filter: 'invert(1)',
                },
              }}
            />
            <TextField
              label="Date To"
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                minWidth: 140,
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  filter: 'invert(1)',
                },
              }}
            />
            <TextField
              label="Min Amount"
              type="number"
              value={amountMin}
              onChange={e => { setAmountMin(e.target.value); setPage(1); }}
              size="small"
              style={{ minWidth: 120 }}
            />
            <TextField
              label="Max Amount"
              type="number"
              value={amountMax}
              onChange={e => { setAmountMax(e.target.value); setPage(1); }}
              size="small"
              style={{ minWidth: 120 }}
            />

            <TextField
              label="Search"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              size="small"
              style={{ minWidth: 180 }}
              InputProps={{ endAdornment: <IconButton size="small"><SearchIcon /></IconButton> }}
            />
          </div>

          {/* Transactions Table with Sorting and Pagination */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #eee', padding: 8, cursor: 'pointer' }} onClick={() => { setSortBy('date'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Date {sortBy==='date' ? (sortDir==='asc'?'↑':'↓') : ''}</th>
                <th style={{ border: '1px solid #eee', padding: 8, cursor: 'pointer' }} onClick={() => { setSortBy('amount'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Amount {sortBy==='amount' ? (sortDir==='asc'?'↑':'↓') : ''}</th>
                <th style={{ border: '1px solid #eee', padding: 8, cursor: 'pointer' }} onClick={() => { setSortBy('category'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Category {sortBy==='category' ? (sortDir==='asc'?'↑':'↓') : ''}</th>
                <th style={{ border: '1px solid #eee', padding: 8, cursor: 'pointer' }} onClick={() => { setSortBy('status'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>Status {sortBy==='status' ? (sortDir==='asc'?'↑':'↓') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(t => (
                <tr key={t._id}>
                  <td style={{ border: '1px solid #eee', padding: 8 }}>{new Date(t.date).toLocaleDateString()}</td>
                  <td style={{ border: '1px solid #eee', padding: 8 }}>{t.amount}</td>
                  <td style={{ border: '1px solid #eee', padding: 8 }}>{t.category}</td>
                  <td style={{ border: '1px solid #eee', padding: 8 }}>{t.status}</td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 16, color: '#999' }}>No transactions found.</td></tr>}
            </tbody>
          </table>
          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: page === 1 ? '#23263a' : 'linear-gradient(90deg, #7c3aed 0%, #7c3aed 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 16,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.6 : 1
              }}
            >Previous</button>
            <span style={{ color: '#b0b8d1', fontSize: 16, fontWeight: 500 }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: page === totalPages ? '#23263a' : 'linear-gradient(90deg, #7c3aed 0%, #7c3aed 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 16,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                opacity: page === totalPages ? 0.6 : 1
              }}
            >Next</button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
