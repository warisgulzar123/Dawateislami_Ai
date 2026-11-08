import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Database,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  X,
  Save,
  AlertTriangle,
  ArrowLeft,
  Layers,
  Check,
  Eye,
  Tag,
  BookOpen
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const DEFAULT_FORM_STATE = {
  chunkId: '',
  departmentId: '',
  subCategory: '',
  title: '',
  contentUrdu: '',
  contentEnglish: '',
  keywords: '',
  sourceUrl: 'https://www.dawateislami.net',
  isVerified: true
};

export default function AdminPanel({ token, onBackToChat }) {
  const [chunks, setChunks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Preview Modal State
  const [previewChunk, setPreviewChunk] = useState(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch knowledge chunks from backend
  const fetchKnowledge = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/knowledge`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchQuery,
          departmentId: selectedDept
        }
      });

      if (res.data && res.data.success) {
        setChunks(res.data.data || []);
        setTotalCount(res.data.totalCount || 0);
        setVerifiedCount(res.data.verifiedCount || 0);
        if (res.data.departments) {
          setDepartments(res.data.departments);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to load knowledge chunks from database.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [selectedDept]);

  // Handle Search on Enter or debounced
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchKnowledge();
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData(DEFAULT_FORM_STATE);
    setIsEditing(false);
    setCurrentEditId(null);
    setModalError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (chunk) => {
    setFormData({
      chunkId: chunk.chunkId || '',
      departmentId: chunk.departmentId || '',
      subCategory: chunk.subCategory || '',
      title: chunk.title || '',
      contentUrdu: chunk.contentUrdu || '',
      contentEnglish: chunk.contentEnglish || '',
      keywords: Array.isArray(chunk.keywords)
        ? chunk.keywords.join(', ')
        : chunk.keywords || '',
      sourceUrl: chunk.sourceUrl || 'https://www.dawateislami.net',
      isVerified: chunk.isVerified !== undefined ? chunk.isVerified : true
    });
    setIsEditing(true);
    setCurrentEditId(chunk._id);
    setModalError('');
    setIsModalOpen(true);
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const payload = {
        ...formData,
        keywords: formData.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      };

      if (isEditing) {
        await axios.put(
          `${API_BASE_URL}/knowledge/${currentEditId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        showToast(`Chunk "${formData.chunkId}" updated successfully.`);
      } else {
        await axios.post(`${API_BASE_URL}/knowledge`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast(`New chunk "${formData.chunkId}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchKnowledge();
    } catch (err) {
      console.error('Save error:', err);
      setModalError(
        err.response?.data?.error ||
        err.message ||
        'Failed to save knowledge chunk.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await axios.delete(`${API_BASE_URL}/knowledge/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`Chunk "${deleteTarget.chunkId}" deleted successfully.`);
      setDeleteTarget(null);
      fetchKnowledge();
    } catch (err) {
      console.error('Delete error:', err);
      alert(
        err.response?.data?.error ||
        err.message ||
        'Failed to delete knowledge chunk.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 md:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToChat}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Return to AI Chat"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Chat</span>
            </button>

            <div className="h-5 w-px bg-slate-200"></div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Database className="w-4 h-4 text-emerald-100" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Knowledge Base Dashboard
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Dawat-e-Islami AI Assistant Vector Knowledge Manager
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chunk</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Toast Alert */}
        {successToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Chunks Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs transition-all hover:shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Chunks</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Active in Vector Database</p>
          </div>

          {/* Verified Chunks Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs transition-all hover:shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Data</p>
                <h3 className="text-2xl font-bold text-teal-700 mt-1">{verifiedCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-teal-600 mt-2">100% Authentic Reference</p>
          </div>

          {/* Departments Covered Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs transition-all hover:shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Departments</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{departments.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Fatwa, FGRF, Jamia, Maktaba, IT</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, chunkId, department, keywords, or content..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs md:text-sm outline-hidden transition-all"
            />
          </form>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent border-0 focus:outline-hidden text-xs font-medium cursor-pointer"
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchKnowledge}
              title="Refresh Table"
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Knowledge Chunks Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Chunk ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4 min-w-[260px]">Content Preview</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading && chunks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      <span>Loading knowledge chunks from MongoDB...</span>
                    </td>
                  </tr>
                ) : chunks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <span>No knowledge chunks found matching your search.</span>
                    </td>
                  </tr>
                ) : (
                  chunks.map((chunk) => (
                    <tr
                      key={chunk._id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Chunk ID */}
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-800 select-all whitespace-nowrap">
                        {chunk.chunkId}
                      </td>

                      {/* Department ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                          {chunk.departmentId}
                        </span>
                        {chunk.subCategory && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {chunk.subCategory}
                          </span>
                        )}
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                        <span className="line-clamp-2">{chunk.title}</span>
                        {chunk.sourceUrl && (
                          <a
                            href={chunk.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-700 hover:underline mt-1"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Source Link</span>
                          </a>
                        )}
                      </td>

                      {/* Truncated Text Previews with Expandable click */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => setPreviewChunk(chunk)}
                          className="cursor-pointer group-hover:opacity-90"
                          title="Click to preview full content"
                        >
                          {chunk.contentUrdu && (
                            <p
                              dir="rtl"
                              className="font-urdu text-[12px] text-slate-700 line-clamp-2 leading-relaxed"
                            >
                              {chunk.contentUrdu}
                            </p>
                          )}
                          {chunk.contentEnglish && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
                              {chunk.contentEnglish}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Verified Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {chunk.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Styled Action Buttons: View (Slate), Edit (Indigo), Delete (Rose) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Preview Button */}
                          <button
                            onClick={() => setPreviewChunk(chunk)}
                            title="View Full Content"
                            className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">View</span>
                          </button>

                          {/* Edit Button (Indigo) */}
                          <button
                            onClick={() => handleOpenEdit(chunk)}
                            title="Edit Chunk"
                            className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Edit</span>
                          </button>

                          {/* Delete Button (Rose) */}
                          <button
                            onClick={() => setDeleteTarget(chunk)}
                            title="Delete Chunk"
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {chunks.length} of {totalCount} total database chunks
            </span>
            <span className="text-[11px] text-slate-400">
              Vector Dimensions: 3072 • Grounding: Real-time
            </span>
          </div>
        </div>
      </main>

      {/* EXPANDABLE FULL CONTENT PREVIEW MODAL */}
      {previewChunk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold uppercase">
                  {previewChunk.chunkId}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                  {previewChunk.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewChunk(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Department & Verification */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                  Dept: {previewChunk.departmentId}
                </span>
                {previewChunk.subCategory && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                    Category: {previewChunk.subCategory}
                  </span>
                )}
                {previewChunk.isVerified ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Verified Reference
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                    Pending Verification
                  </span>
                )}
              </div>

              {/* Urdu Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Urdu Knowledge Content
                </label>
                <div
                  dir="rtl"
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-urdu text-sm text-slate-800 leading-loose text-right"
                >
                  {previewChunk.contentUrdu}
                </div>
              </div>

              {/* English Content */}
              {previewChunk.contentEnglish && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    English Content / Translation
                  </label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {previewChunk.contentEnglish}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {previewChunk.keywords && previewChunk.keywords.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Search Keywords
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {previewChunk.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-800 border border-emerald-200"
                      >
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Source URL */}
              {previewChunk.sourceUrl && (
                <div className="pt-2">
                  <a
                    href={previewChunk.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:underline font-semibold"
                  >
                    <span>View Official Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setPreviewChunk(null);
                  handleOpenEdit(previewChunk);
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit this chunk</span>
              </button>
              <button
                onClick={() => setPreviewChunk(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  {isEditing ? (
                    <Edit2 className="w-4 h-4 text-emerald-100" />
                  ) : (
                    <Plus className="w-4 h-4 text-emerald-100" />
                  )}
                </div>
                <h3 className="text-base font-bold text-white">
                  {isEditing ? 'Edit Knowledge Chunk' : 'Add New Knowledge Chunk'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Chunk ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chunk ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.chunkId}
                    onChange={(e) =>
                      setFormData({ ...formData, chunkId: e.target.value })
                    }
                    placeholder="e.g. DI_JAMIA_005"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm outline-hidden font-mono"
                  />
                </div>

                {/* Department ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentId: e.target.value })
                    }
                    placeholder="e.g. taleem_jamia, fgrf_welfare"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SubCategory */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sub Category
                  </label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) =>
                      setFormData({ ...formData, subCategory: e.target.value })
                    }
                    placeholder="e.g. Admission Criteria"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm outline-hidden"
                  />
                </div>

                {/* Source URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Source URL
                  </label>
                  <input
                    type="url"
                    value={formData.sourceUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, sourceUrl: e.target.value })
                    }
                    placeholder="https://www.dawateislami.net"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm outline-hidden"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title / عنوان <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="جامعۃ المدینہ میں داخلے کا باقاعدہ طریقہ کار"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm outline-hidden font-urdu"
                />
              </div>

              {/* Urdu Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Content (Urdu) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  dir="rtl"
                  value={formData.contentUrdu}
                  onChange={(e) =>
                    setFormData({ ...formData, contentUrdu: e.target.value })
                  }
                  placeholder="مستند مواد یہاں درج فرمائیں..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm outline-hidden font-urdu leading-loose text-right resize-y"
                />
              </div>

              {/* English Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Content (English Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.contentEnglish}
                  onChange={(e) =>
                    setFormData({ ...formData, contentEnglish: e.target.value })
                  }
                  placeholder="English summary or translation..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm outline-hidden resize-y"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) =>
                    setFormData({ ...formData, keywords: e.target.value })
                  }
                  placeholder="jamia, admission, taleem, dars-e-nizami"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs sm:text-sm outline-hidden"
                />
              </div>

              {/* Verified Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={formData.isVerified}
                  onChange={(e) =>
                    setFormData({ ...formData, isVerified: e.target.checked })
                  }
                  className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="isVerified"
                  className="text-xs font-medium text-slate-700 cursor-pointer"
                >
                  Mark as Verified (Active in AI Knowledge Search)
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{modalLoading ? 'Saving...' : isEditing ? 'Update Chunk' : 'Create Chunk'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Confirm Delete</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to delete chunk{' '}
              <span className="font-mono font-bold text-slate-900">"{deleteTarget.chunkId}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
