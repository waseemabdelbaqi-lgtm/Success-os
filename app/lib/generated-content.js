'use client';

const STORAGE_KEY='success-os-generated-content';

export function saveGeneratedContent(payload){
  if(typeof window==='undefined')return null;
  const now=new Date();
  const item={
    id:payload.id||`CNT-${now.getTime().toString().slice(-9)}`,
    created:now.toLocaleString('ar-JO'),
    createdAt:now.toISOString(),
    protected:true,
    reviewStatus:'بانتظار المراجعة الأكاديمية',
    ...payload
  };
  let list=[];
  try{list=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{}
  localStorage.setItem(STORAGE_KEY,JSON.stringify([item,...list.filter(x=>x.id!==item.id)]));
  window.dispatchEvent(new CustomEvent('success-os-content-saved',{detail:item}));
  return item;
}

