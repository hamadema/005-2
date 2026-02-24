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
  // Only one toggle now - Show Paid/Hide Paid
  const [showPaidItems, setShowPaidItems] = useState(false);

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

  // Filter items based on showPaidItems only
  const filteredItems = useMemo(() => {
    let items = costsWithPaidStatus.map(c => ({ 
      ...c, 
      itemType: 'COST' as const
    }));

    // Filter out paid items if showPaidItems is false
    if (!showPaidItems) {
      items = items.filter(item => !(item as any).isPaid);
    }

    // Sort by date (newest first)
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [costsWithPaidStatus, showPaidItems]);

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
        <p className="text-slate-400 text-xs font-medium">
          {showPaidItems ? 'No work items found.' : 'No pending items. Click "Show Paid" to see completed work.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {showPaidItems ? 'Completed Work' : 'Pending Work'}
          </h3>
          <span className="text-[9px] text-slate-400 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-100">
            {filteredItems.length}
          </span>
        </div>
        
        {/* Only one toggle button - Show Paid/Hide Paid */}
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
      </div>
      
      <div className="divide-y divide-slate-50">
        {filteredItems.map((item) => {
          const rawItem = item as any;
          const baseAmount = Number(rawItem.amount) || 0;
          const extraCharges = Number(rawItem.extraCharges) || 0;
          const totalAmount = baseAmount + extraCharges;
          const isOwner = item.addedBy === currentUser.name || currentUser.name === 'Sanjaya';
          
          const displayLabel = rawItem.description || 'Design Work';
          const isPaid = (item as any).isPaid;
          
          // Only show checkboxes for Ravi on unpaid items
          const showCheckbox = !isPaid && currentUser.role === UserRole.RAVI && onToggleSelect;
          
          return (
            <div 
              key={item.id} 
              onClick={() => {
                // Only allow selection for Ravi on unpaid items
                if (showCheckbox) {
                  onToggleSelect(item.id);
                }
              }}
              className={`p-3 flex items-center justify-between transition-colors ${
                showCheckbox ? 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer' : ''
              } ${
                selectedIds.includes(item.id) && !isPaid ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : ''
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {/* Only show checkboxes for Ravi on unpaid items */}
                {showCheckbox && (
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
                  isPaid ? 'bg-green-100 text-green-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <span className="text-[7px] font-black uppercase tracking-tighter">
                    {isPaid ? 'PAID' : 'WORK'}
                  </span>
                </div>
                
                <div className="overflow-hidden">
                  <p className={`text-xs font-bold leading-tight truncate pr-1 ${
                    isPaid ? 'text-green-600' : 'text-slate-800'
                  }`}>
                    {displayLabel}
                    {isPaid && (
                      <span className="ml-2 text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                        Paid
                      </span>
                    )}
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
                    isPaid ? 'text-green-600' : 'text-rose-500'
                  }`}>
                    {isPaid ? '✓' : '-'}Rs.{totalAmount.toLocaleString()}
                  </p>
                  {extraCharges > 0 && (
                    <p className="text-[7px] text-slate-400 font-bold uppercase">+Rs.{extraCharges} extra</p>
                  )}
                </div>
                
                {/* Delete button - Only Sanjaya can delete items */}
                {currentUser.role === 'SANJAYA' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id, 'COST');
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