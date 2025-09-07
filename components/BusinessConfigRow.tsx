

import React, { useState, useEffect } from 'react';
import { Business } from '../types';
import { BuildingStorefrontIcon, TrashIcon, PencilIcon, SaveIcon, ExclamationTriangleIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useConfirmation } from '../contexts/ConfirmationContext';

interface BusinessConfigRowProps {
    business: Business;
    onManage: () => void;
    onRemove: (id: string) => void;
    onUpdateBusiness: (updatedBusiness: Business) => void;
}

const BusinessConfigRow: React.FC<BusinessConfigRowProps> = ({ business, onManage, onRemove, onUpdateBusiness }) => {
    const { t } = useLanguage();
    const { showConfirmation } = useConfirmation();
    const [isEditing, setIsEditing] = useState(false);
    const [editableBusiness, setEditableBusiness] = useState(business);

    useEffect(() => {
        setEditableBusiness(business);
    }, [business]);

    const handleSave = () => {
        onUpdateBusiness(editableBusiness);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditableBusiness(business);
        setIsEditing(false);
    };

    const handleFieldChange = (field: keyof Omit<Business, 'id' | 'subscriptionStatus' | 'subscriptionValidUntil' | 'theme'>, value: string | number | boolean) => {
        setEditableBusiness(prev => ({...prev, [field]: value}));
    };
    
    const handleRemoveClick = () => {
        showConfirmation({
            message: t('confirmRemoveBusiness'),
            onConfirm: () => onRemove(business.id)
        });
    };
    
    const inputStyles = "w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-500";

    if (isEditing) {
        return (
             <div className="p-4 bg-white dark:bg-neutral-600 rounded-lg shadow-lg border-2 border-primary space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-300">{t('businessNameLabel')}</label>
                        <input type="text" value={editableBusiness.name} onChange={(e) => handleFieldChange('name', e.target.value)} className={inputStyles}/>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-300">{t('addressLabel')}</label>
                        <input type="text" value={editableBusiness.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} className={inputStyles}/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-300">{t('ownerNameLabel')}</label>
                        <input type="text" value={editableBusiness.ownerName || ''} onChange={(e) => handleFieldChange('ownerName', e.target.value)} className={inputStyles}/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-300">{t('ownerEmailLabel')}</label>
                        <input type="email" value={editableBusiness.ownerEmail || ''} onChange={(e) => handleFieldChange('ownerEmail', e.target.value)} className={inputStyles}/>
                    </div>
                </div>
                 <div className="p-3 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                    <h4 className="text-base font-semibold mb-3">{t('cancellationFeeTitle')}</h4>
                    <div className="flex items-center mb-3">
                        <input type="checkbox" id={`enableCancellation-${editableBusiness.id}`} checked={!!editableBusiness.enableCancellationFee} onChange={e => handleFieldChange('enableCancellationFee', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor={`enableCancellation-${editableBusiness.id}`} className="ms-2 text-sm text-neutral-600 dark:text-neutral-300">{t('enableCancellationFeeLabelBusiness')}</label>
                    </div>
                    {editableBusiness.enableCancellationFee && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('cancellationFeeHoursLabel')}</label>
                            <input type="number" value={editableBusiness.cancellationFeeHours} onChange={e => handleFieldChange('cancellationFeeHours', parseInt(e.target.value) || 0)} className={`${inputStyles} bg-white dark:bg-neutral-800`}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">{t('cancellationFeeAmountLabel')}</label>
                            <input type="number" step="0.01" value={editableBusiness.cancellationFeeAmount} onChange={e => handleFieldChange('cancellationFeeAmount', parseFloat(e.target.value) || 0 )} className={`${inputStyles} bg-white dark:bg-neutral-800`}/>
                        </div>
                    </div>
                    )}
                </div>
                <div className="flex gap-2 justify-end pt-2">
                    <button onClick={handleCancel} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-500 text-black dark:text-white font-medium rounded-md transition duration-150 text-sm">{t('cancelButton')}</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-md transition duration-150 flex items-center text-sm"><SaveIcon className="w-5 h-5 me-1.5"/>{t('saveButton')}</button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-full me-4">
                    <BuildingStorefrontIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <p className="font-semibold text-lg text-primary">{business.name}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{business.ownerName} - {business.ownerEmail}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{business.address}</p>
                </div>
            </div>
            <div className="flex gap-2 self-end sm:self-center">
                 <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-full transition-colors"
                    title={t('editButton')}
                >
                    <PencilIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={handleRemoveClick}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
                    title={t('removeButton')}
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={onManage}
                    className="px-4 py-2 bg-secondary hover:bg-emerald-600 text-white font-medium rounded-md transition duration-150 flex items-center text-sm"
                >
                    {t('manageButton')}
                </button>
            </div>
        </div>
    );
};

export default BusinessConfigRow;
