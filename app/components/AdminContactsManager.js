'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminContactsManager() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: search
      });

      const response = await fetch(`/api/admin/contacts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');

      const data = await response.json();
      setContacts(data.contacts || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSubmit = async (formData) => {
    try {
      setFormLoading(true);
      const url = editingContact 
        ? `/api/admin/contacts/${editingContact.id}`
        : '/api/admin/contacts';
      
      const method = editingContact ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save contact');
      }

      setShowForm(false);
      setEditingContact(null);
      fetchContacts();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (contact) => {
    if (!confirm(`Are you sure you want to delete contact "${contact.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/contacts/${contact.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete contact');
      
      fetchContacts();
    } catch (err) {
      setError(err.message);
    }
  };

  const ContactForm = ({ contact, onSubmit, onCancel, loading }) => {
    const [formData, setFormData] = useState({
      name: contact?.name || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      message: contact?.message || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                {loading ? 'Saving...' : (contact ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Contacts Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Contact
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
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {contacts.map((contact) => (
            <li key={contact.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                    <p className="ml-2 text-sm text-gray-500">{contact.email}</p>
                  </div>
                  {contact.phone && (
                    <p className="text-sm text-gray-500 mt-1">{contact.phone}</p>
                  )}
                  {contact.message && (
                    <p className="text-sm text-gray-600 mt-1 truncate">{contact.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(contact.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingContact(contact);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(contact)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
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
        <ContactForm
          contact={editingContact}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingContact(null);
          }}
          loading={formLoading}
        />
      )}
    </div>
  );
}
