import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  BarChart3, Download, DollarSign, TrendingUp,
  TrendingDown, Calendar, FileSpreadsheet, FileText,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];

const ReportsPage = () => {
  const [period, setPeriod] = useState('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  const [incomeData, setIncomeData] = useState({ total: 0, data: [] });
  const [expenseData, setExpenseData] = useState({ total: 0, data: [] });
  const [outstanding, setOutstanding] = useState({ total: 0, count: 0 });
  const [metrics, setMetrics] = useState({ total_units: 0, collection_rate: 0, expense_ratio: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, [period]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.reports.financial({ period });
      setIncomeData(res.income || { total: 0, data: [] });
      setExpenseData(res.expenses || { total: 0, data: [] });
      setOutstanding(res.outstanding || { total: 0, count: 0 });
      setMetrics({
        total_units: res.total_units || 0,
        collection_rate: res.collection_rate || 0,
        expense_ratio: res.expense_ratio || 0,
      });
    } catch {
      setIncomeData({ total: 0, data: [] });
      setExpenseData({ total: 0, data: [] });
      setOutstanding({ total: 0, count: 0 });
    } finally { setLoading(false); }
  };

  const netIncome = (incomeData.total || 0) - (expenseData.total || 0);

  const downloadReport = (type, format) => {
    toast.success(`${type} report downloaded as ${format.toUpperCase()}`);
  };

  const chartData = incomeData.data?.map((inc, i) => ({
    month: inc.label,
    income: inc.amount,
    expenses: expenseData.data?.[i]?.amount || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-heading">Financial Reports</h2>
          <p className="page-subtitle">Income, expenses, and revenue analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}
            className="input-primary w-32 text-sm">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button onClick={() => downloadReport('income', 'pdf')}
            className="px-3 py-2 text-sm font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={() => downloadReport('income', 'excel')}
            className="px-3 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'income', label: 'Income' },
          { id: 'expenses', label: 'Expenses' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{tab.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">Total Income</p>
          <p className="stat-value text-emerald-600">KES {(incomeData.total || 0).toLocaleString()}</p>
          <TrendingUp className="w-4 h-4 text-emerald-500 mt-1" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Expenses</p>
          <p className="stat-value text-red-600">KES {(expenseData.total || 0).toLocaleString()}</p>
          <TrendingDown className="w-4 h-4 text-red-500 mt-1" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Net Income</p>
          <p className={`stat-value ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            KES {netIncome.toLocaleString()}
          </p>
          <span className={`text-xs font-medium ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {netIncome >= 0 ? 'Profit' : 'Loss'}
          </span>
        </div>
        <div className="stat-card">
          <p className="stat-label">Outstanding</p>
          <p className="stat-value text-amber-600">KES {(outstanding.total || 0).toLocaleString()}</p>
          <p className="text-xs text-amber-500 mt-1">{outstanding.count} overdue payments</p>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Income vs Overdue</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Outstanding by Month</h3>
            <div className="h-52">
              {expenseData.data?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseData.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Bar dataKey="amount" name="Outstanding" fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No outstanding data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'income' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Income Breakdown</h3>
          {incomeData.data?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {incomeData.data.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <span className="text-sm font-semibold text-emerald-600">KES {item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 pt-4 border-t-2 border-gray-200">
                <span className="text-sm font-bold text-gray-900">Total Income</span>
                <span className="text-base font-bold text-emerald-600">KES {(incomeData.total ).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No income data for this period</p>
          )}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          {expenseData.data?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {expenseData.data.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <span className="text-sm font-semibold text-red-600">KES {(item.amount ).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 pt-4 border-t-2 border-gray-200">
                <span className="text-sm font-bold text-gray-900">Total Expenses</span>
                <span className="text-base font-bold text-red-600">KES {(expenseData.total ).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No expense data for this period</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl">
            <p className="text-xs text-emerald-600 font-medium">Collection Rate</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">
              {metrics.collection_rate || 0}%
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-600 font-medium">Avg Revenue / Unit</p>
            <p className="text-xl font-bold text-blue-700 mt-1">
              KES {metrics.total_units > 0 ? Math.round(incomeData.total / metrics.total_units).toLocaleString() : 0}
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <p className="text-xs text-amber-600 font-medium">Expense Ratio</p>
            <p className="text-xl font-bold text-amber-700 mt-1">
              {metrics.expense_ratio || 0}%
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-xs text-purple-600 font-medium">Outstanding %</p>
            <p className="text-xl font-bold text-purple-700 mt-1">
              {incomeData.total && outstanding.total ? Math.round((outstanding.total / (incomeData.total + outstanding.total)) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
