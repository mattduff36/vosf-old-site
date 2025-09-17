'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminFAQManager() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const fetchFAQs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: search,
        sortBy: 'sort_order',
        sortOrder: 'asc'
      });

      const response = await fetch(`/api/admin/faq?${params}`);
      if (!response.ok) throw new Error('Failed to fetch FAQ entries');

      const data = await response.json();
      setFaqs(data.faqs || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      const url = editingFAQ 
        ? `/api/admin/faq/${editingFAQ.id}`
        : '/api/admin/faq';
      
      const method = editingFAQ ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save FAQ entry');
      }

      setShowForm(false);
      setEditingFAQ(null);
      fetchFAQs();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (faq) => {
    if (!confirm(`Are you sure you want to delete this FAQ entry?`)) return;

    try {
      const response = await fetch(`/api/admin/faq/${faq.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete FAQ entry');
      
      fetchFAQs();
    } catch (err) {
      setError(err.message);
    }
  };

  const moveUp = async (faq) => {
    const newSortOrder = Math.max(0, (faq.sort_order || 0) - 1);
    await handleSubmit({ ...faq, sort_order: newSortOrder });
  };

  const moveDown = async (faq) => {
    const newSortOrder = (faq.sort_order || 0) + 1;
    await handleSubmit({ ...faq, sort_order: newSortOrder });
  };

  const FAQForm = ({ faq, onSubmit, onCancel, loading }) => {
    const [formData, setFormData] = useState({
      question: faq?.question || '',
      answer: faq?.answer || '',
      sort_order: faq?.sort_order || 0
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({
        ...formData,
        sort_order: parseInt(formData.sort_order) || 0
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {faq ? 'Edit FAQ Entry' : 'Add New FAQ Entry'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question *
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer *
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : (faq ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading && faqs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">FAQ Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add FAQ Entry
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search FAQ entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <li key={faq.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                      #{faq.sort_order || 0}
                    </span>
                    <h3 className="text-sm font-medium text-gray-900">{faq.question}</h3>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{faq.answer}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => moveUp(faq)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveDown(faq)}
                      disabled={index === faqs.length - 1}
                      className="text-gray-400 hover:text-gray-600 text-xs disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingFAQ(faq);
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(faq)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {showForm && (
        <FAQForm
          faq={editingFAQ}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingFAQ(null);
          }}
          loading={formLoading}
        />
      )}
    </div>
  );
}
