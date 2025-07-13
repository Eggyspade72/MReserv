

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { XCircleIcon, CheckCircleIcon } from './Icons';
import { Business, Barber, CustomerReport, CustomerReportInsert } from '../types';

interface ReportProblemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (report: CustomerReportInsert) => void;
    businesses: Business[];
    barbers: Barber[];
}

const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ isOpen, onClose, onSubmit, businesses, barbers }) => {
    const { t } = useLanguage();
    const [phone, setPhone] = useState('');
    const [selectedBusinessId, setSelectedBusinessId] = useState('');
    const [selectedBarberId, setSelectedBarberId] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const barbersInSelectedBusiness = useMemo(() => {
        return barbers.filter(b => b.businessId === selectedBusinessId);
    }, [barbers, selectedBusinessId]);

    useEffect(() => {
        if (isOpen) {
            setPhone('');
            setSelectedBusinessId('');
            setSelectedBarberId('');
            setMessage('');
            setError('');
        }
    }, [isOpen]);
    
    useEffect(() => {
        // Reset barber selection if business changes
        setSelectedBarberId('');
    }, [selectedBusinessId]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!phone || !selectedBusinessId || !selectedBarberId || !message) {
            setError(t('errorAllReportFieldsRequired'));
            return;
        }

        onSubmit({
            reported_by_customer_phone: phone,
            businessId: selectedBusinessId,
            reported_barber_id: selectedBarberId,
            report_message: message,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-primary">{t('reportProblemTitle')}</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                        <XCircleIcon className="w-7 h-7" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="reportPhone" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('yourPhoneNumber')}</label>
                        <input type="tel" id="reportPhone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md" required />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="reportBusiness" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('reportRegardingBusiness')}</label>
                            <select id="reportBusiness" value={selectedBusinessId} onChange={e => setSelectedBusinessId(e.target.value)} className="w-full p-2.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md" required>
                                <option value="" disabled>{t('selectBusiness')}</option>
                                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="reportBarber" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('reportRegardingBarber')}</label>
                            <select id="reportBarber" value={selectedBarberId} onChange={e => setSelectedBarberId(e.target.value)} className="w-full p-2.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md" disabled={!selectedBusinessId} required>
                                <option value="" disabled>{t('selectBarber')}</option>
                                {barbersInSelectedBusiness.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="reportMessage" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t('reportMessageLabel')}</label>
                        <textarea id="reportMessage" value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full p-2.5 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md" required></textarea>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-600 rounded-md">{t('cancelButton')}</button>
                        <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-md flex items-center"><CheckCircleIcon className="w-5 h-5 me-2" />{t('submitReportButton')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportProblemModal;