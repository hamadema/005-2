import React, { useState, useMemo } from 'react';
import { DesignCost, Payment, User, UserRole } from '../types';

interface HistoryListProps {
  costs: DesignCost[];
  payments: Payment[];
  onDelete: (id: string, type: 'COST' | 'PAYMENT') => void;
  currentUser: User;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ 
  costs, 
  payments, 
  onDelete, 
  currentUser,
  selectedIds = [],
  onToggleSelect
}) => {
  const [showPaidItems, setShowPaidItems] = useState(false);
  const [showPayments, setShowPayments] = useState(currentUser.role !== UserRole.RAVI);

  // Create a set of paid item descriptions to check which items are paid
  const paidItems = useMemo(() => {
    const paidSet = new Set();
    payments.forEach(payment => {
      if (payment.note.startsWith('Payment for:')) {
        const descriptions = payment.note.replace('Payment for: ', '').split(', ');
        descriptions.forEach(desc => {
          const itemName = desc.split(' (Rs.')[0];
          paidSet.add(itemName);
        });
      }
    });
    return paidSet;
  }, [payments]);

  // Mark costs as paid if they appear in paidItems
  const costsWithPaidStatus = useMemo(() => {
    return costs.map(cost => ({
      ...cost,
      isPaid: paidItems.has(cost.description)
    }));
  }, [costs, paidItems]);

  // Filter items based on showPaidItems and showPayments
  const filteredItems = useMemo(() => {
    let items = [
      ...costsWithPaidStatus.map(c => ({ 
        ...c, 
        itemType: 'COST' as const
      })),
      ...(showPayments ? payments.map(p => ({ 
        ...p, 
        itemType: 'PAYMENT' as const 
      })) : [])
    ];

    // Filter out paid items if showPaidItems is false
    if (!showPaidItems) {
      items = items.filter(item => {
        // Hide paid costs
        if (item.itemType === 'COST' && (item as any).isPaid) {
          return false;
        }
        // Hide payment records that are for specific items
        if (item.itemType === 'PAYMENT' && item.note.startsWith('Payment for:')) {
          return false;
        }
        return true;
      });
    }

    // Sort by date (newest first)
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [costsWithPaidStatus, payments, showPaidItems, showPayments]);

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
        <p className="text-slate-400 text-xs font-medium">
          {showPaidItems ? 'No activity logged.' : 'No unpaid items. Click "Show Paid" to see all history.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {showPaidItems ? 'Complete History' : 'Pending Items'}
          </h3>
          <span className="text-[9px] text-slate-400 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-100">
            {filteredItems.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowPaidItems(!showPaidItems)}
            className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border transition-all ${
              showPaidItems 
                ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}
          >
            {showPaidItems ? 'Hide Paid' : 'Show Paid'}
          </button>
          {currentUser.role !== UserRole.RAVI && (
            <button 
              onClick={() => setShowPayments(!showPayments)}
              className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border transition-all ${
                showPayments 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-slate-50 text-slate-400 border-slate-100'
              }`}
            >
              {showPayments ? 'Hide Payments' : 'Show Payments'}
            </button>
          )}
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {filteredItems.map((item) => {
          const rawItem = item as any;
          const baseAmount = Number(rawItem.amount) || 0;
          const extraCharges = item.itemType === 'COST' ? (Number(rawItem.extraCharges) || 0) : 0;
          const totalAmount = baseAmount + extraCharges;
          const isOwner = item.addedBy === currentUser.name || currentUser.name === 'Sanjaya';
          
          const displayLabel = item.itemType === 'COST' 
            ? (rawItem.description || 'Design Work') 
            : (rawItem.note || 'Payment');
          
          const isPaid = item.itemType === 'COST' && (item as any).isPaid;
          
          return (
            <div 
              key={item.id} 
              onClick={() => {
                if (item.itemType === 'COST' && !isPaid && onToggleSelect && currentUser.role === UserRole.RAVI) {
                  onToggleSelect(item.id);
                }
              }}
              className={`p-3 flex items-center justify-between transition-colors ${
                isPaid 
                  ? 'bg-green-50/30' 
                  : 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer'
              } ${
                selectedIds.includes(item.id) && !isPaid ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : ''
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {item.itemType === 'COST' && onToggleSelect && !isPaid && currentUser.role === UserRole.RAVI && (
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelect(item.id);
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  item.itemType === 'COST' 
                    ? isPaid ? 'bg-green-100 text-green-600' : 'bg-emerald-50 text-emerald-600'
                    : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <span className="text-[7px] font-black uppercase tracking-tighter">
                    {item.itemType === 'COST' ? (isPaid ? 'PAID' : 'WORK') : 'PAY'}
                  </span>
                </div>
                <div className="overflow-hidden">
                  <p className={`text-xs font-bold leading-tight truncate pr-1 ${
                    isPaid ? 'text-green-600' : 'text-slate-800'
                  }`}>
                    {displayLabel}
                  </p>
                  <div className="flex items-center gap-1.5 text-[8px] text-slate-400 mt-0.5 font-bold uppercase tracking-tight">
                    <span>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <span className="truncate">By {item.addedBy}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className={`font-black text-xs break-all ${
                    item.itemType === 'COST' 
                      ? isPaid ? 'text-green-600' : 'text-rose-500'
                      : 'text-emerald-500'
                  }`}>
                    {item.itemType === 'COST' && isPaid ? '✓' : item.itemType === 'COST' ? '-' : '+'}
                    Rs.{totalAmount.toLocaleString()}
                  </p>
                  {extraCharges > 0 && (
                    <p className="text-[7px] text-slate-400 font-bold uppercase">+Rs.{extraCharges} extra</p>
                  )}
                </div>
                {(currentUser.role === 'SANJAYA' || (currentUser.role === 'RAVI' && item.itemType === 'PAYMENT' && isOwner)) && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id, item.itemType);
                    }}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryList;