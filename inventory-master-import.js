/* LEDGERLB inventory master-data importer: source data stays in the user's browser. */
(function(){
  const required=['Supplier','TYPE','PRODUCT','QTY CURRENT','INITIAL QTY','SOLD','BUY','LBP','USD','CAL'];
  function parseCSV(text){
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];
      if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}
      else if(c==='"')quoted=true;
      else if(c===','){row.push(cell);cell=''}
      else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>String(x).trim()))rows.push(row);row=[];cell=''}
      else cell+=c;
    }
    if(quoted)throw Error('Unclosed quote in CSV');
    row.push(cell);if(row.some(x=>String(x).trim()))rows.push(row);return rows;
  }
  const trim=x=>String(x??'').trim();
  const norm=x=>trim(x).toLocaleLowerCase();
  const number=(x,name,n)=>{const v=trim(x);if(!v||!Number.isFinite(Number(v)))throw Error('Row '+n+': invalid '+name);return Number(v)};
  function makePlan(source){
    const matrix=parseCSV(source.replace(/^\uFEFF/,''));
    if(matrix.length<2)throw Error('No inventory rows found.');
    const header=matrix[0].map(trim),pos=Object.fromEntries(header.map((h,i)=>[h.toUpperCase(),i]));
    const missing=required.filter(k=>pos[k.toUpperCase()]===undefined);
    if(missing.length)throw Error('Missing columns: '+missing.join(', '));
    const plans=[],seen=new Set(),warnings=[];
    for(let idx=1;idx<matrix.length;idx++){
      const row=matrix[idx],get=k=>trim(row[pos[k.toUpperCase()]]);
      const supplier=get('Supplier'),type=get('TYPE'),product=get('PRODUCT');
      if(!supplier||!type||!product)throw Error('Row '+(idx+1)+': supplier, type and product required');
      const key=norm(supplier)+'|'+norm(product);
      if(seen.has(key))throw Error('Duplicate supplier-product in file: '+supplier+' / '+product);seen.add(key);
      const qty=number(get('QTY CURRENT'),'QTY CURRENT',idx+1),initial=number(get('INITIAL QTY'),'INITIAL QTY',idx+1),sold=number(get('SOLD'),'SOLD',idx+1),buy=number(get('BUY'),'BUY',idx+1),lbp=number(get('LBP'),'LBP',idx+1),usd=number(get('USD'),'USD',idx+1),cal=number(get('CAL'),'CAL',idx+1);
      if(qty<0||usd<0||lbp<0)throw Error('Row '+(idx+1)+': negative current quantity or price');
      if(initial<0||sold<0||buy<0)warnings.push('Row '+(idx+1)+': negative historical quantity; source retained');
      plans.push({supplier,type,product,description:get('DESCIPTION')||get('DESCRIPTION'),qty,initial,sold,buy,lbp,usd,cal});
    }
    return {plans,warnings};
  }
  function importMaster(text){
    if(typeof erpData==='undefined'||!Array.isArray(erpData.products)||!Array.isArray(erpData.suppliers)||!Array.isArray(erpData.supplierProducts))throw Error('StockPro data store unavailable');
    const {plans,warnings}=makePlan(text);
    const existingProducts=new Map(erpData.products.map(p=>[norm(p.code),p]));
    const existingSuppliers=new Map(erpData.suppliers.map(p=>[norm(p.name),p]));
    const supplierCopies=erpData.suppliers.map(x=>({...x})),productCopies=erpData.products.map(x=>({...x})),relations=erpData.supplierProducts.map(x=>({...x}));
    let newProducts=0,updatedProducts=0,newSuppliers=0,newLinks=0;
    const newKeys=new Set();
    for(const item of plans){
      let supplier=existingSuppliers.get(norm(item.supplier));
      if(!supplier){supplier={id:crypto.randomUUID(),name:item.supplier,type:'Supplier',email:'',phone:''};existingSuppliers.set(norm(item.supplier),supplier);supplierCopies.push(supplier);newSuppliers++}
      let product=existingProducts.get(norm(item.product));
      if(!product){product={code:item.product};productCopies.push(product);existingProducts.set(norm(item.product),product);newProducts++}else updatedProducts++;
      Object.assign(product,{code:item.product,name:item.product,category:item.type,description:item.description,qty:item.qty,price:item.usd,inventoryValue:item.qty*item.usd,zeroQtyFlag:item.qty===0,supplierId:supplier.id,sourceInitialQty:item.initial,sourceSold:item.sold,sourceBuy:item.buy,sourceLBP:item.lbp,sourceCAL:item.cal,importSource:'INENTORY TD',minQty:product.minQty??10,reorderQty:product.reorderQty??50});
      const key=supplier.id+'|'+norm(item.product);if(newKeys.has(key))throw Error('Duplicate record');newKeys.add(key);
      let relation=relations.find(x=>x.supplierId===supplier.id&&norm(x.code)===norm(item.product));
      if(!relation){relation={id:crypto.randomUUID(),supplierId:supplier.id,code:item.product};relations.push(relation);newLinks++}
      Object.assign(relation,{name:item.product,category:item.type,unitPrice:item.usd,sourceLBP:item.lbp,leadTime:relation.leadTime??7});
    }
    if(!confirm('Import '+plans.length+' products and link '+new Set(plans.map(x=>norm(x.supplier))).size+' suppliers? Existing matching product records will be updated. This does not create sales, purchases, or accounting entries.'))return null;
    const backup={products:erpData.products,suppliers:erpData.suppliers,supplierProducts:erpData.supplierProducts};
    try{
      erpData.products=productCopies;erpData.suppliers=supplierCopies;erpData.supplierProducts=relations;saveData();
      if(typeof renderInventory==='function')renderInventory();if(typeof renderSuppliers==='function')renderSuppliers();if(typeof renderDashboard==='function')renderDashboard();
    }catch(e){Object.assign(erpData,backup);throw e}
    return {total:plans.length,newProducts,updatedProducts,newSuppliers,newLinks,warnings};
  }
  function addButton(){
    const input=document.createElement('input');input.type='file';input.accept='.csv,text/csv';input.hidden=true;input.id='ledgerlbMasterCSV';document.body.append(input);
    const target=document.querySelector('#inventory-module button[onclick*="importInventoryCSV"]');
    if(!target)return;
    const button=document.createElement('button');button.type='button';button.className=target.className;button.style.background='#6257e9';button.textContent='Import linked inventory + suppliers';button.onclick=()=>input.click();target.parentNode.insertBefore(button,target);
    input.addEventListener('change',async()=>{const file=input.files&&input.files[0];if(!file)return;try{const result=importMaster(await file.text());if(result){const msg='Imported '+result.total+' rows; '+result.newSuppliers+' new suppliers; '+result.newProducts+' new products; '+result.updatedProducts+' updated; '+result.newLinks+' supplier links. '+result.warnings.length+' historical warnings.';alert(msg);if(typeof notify==='function')notify('Linked inventory imported','✅')}}catch(err){alert('Import aborted: '+err.message)}finally{input.value=''}});
  }
  window.LedgerLBInventoryImport={parseCSV,makePlan,importMaster};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addButton);else addButton();
})();
