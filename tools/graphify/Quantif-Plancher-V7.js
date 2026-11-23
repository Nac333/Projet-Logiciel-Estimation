/* Index Graphify. Modifier Quantif-Plancher-V7.html puis exécuter python tools/graphify/sync_index.py. Mêmes numéros de ligne. */



























































































































































































































































const pdfjsLib = await import('data:text/javascript;base64,');
pdfjsLib.GlobalWorkerOptions.workerSrc = 'data:text/javascript;base64,';

/* Geometry stays in rendered-plan pixels. Detection masks never contain takeoff overlays. */
function signedArea(points) {
  return points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0)/2;
}
function netArea(item) {
  const holes=getHoles(item).filter(ring=>ring?.length>=3);
  if(!holes.length)return area(item.points);
  return Math.max(0,area(item.points)-excludedArea(item.points,holes));
}
/* Integrate the union of exclusions inside the room, without counting an
   overlap twice. Between vertex/intersection x coordinates every scanline
   boundary is linear, so its midpoint gives the exact slab area. */
function excludedArea(outer,holes) {
  const bounds=boundsOf(outer),rings=[outer,...holes],edges=[],xs=[bounds.x,bounds.right];
  for(const ring of rings)for(let i=0;i<ring.length;i++) {
    const a=ring[i],b=ring[(i+1)%ring.length];
    if(a.x>=bounds.x&&a.x<=bounds.right)xs.push(a.x);
    if(a.x!==b.x)edges.push({a,b,left:Math.min(a.x,b.x),right:Math.max(a.x,b.x),top:Math.min(a.y,b.y),bottom:Math.max(a.y,b.y)});
  }
  for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++) {
    const a=edges[i],b=edges[j];
    if(a.right<=b.left||b.right<=a.left||a.bottom<b.top||b.bottom<a.top)continue;
    const ax=a.b.x-a.a.x,ay=a.b.y-a.a.y,bx=b.b.x-b.a.x,by=b.b.y-b.a.y,
      den=ax*by-ay*bx;
    if(Math.abs(den)<1e-12)continue;
    const dx=b.a.x-a.a.x,dy=b.a.y-a.a.y,t=(dx*by-dy*bx)/den,u=(dx*ay-dy*ax)/den;
    if(t>0&&t<1&&u>0&&u<1){const x=a.a.x+t*ax;if(x>bounds.x&&x<bounds.right)xs.push(x);}
  }
  const breaks=[...new Set(xs)].sort((a,b)=>a-b);
  const intervals=(ring,x)=>{
    const ys=[];
    for(let i=0;i<ring.length;i++) {
      const a=ring[i],b=ring[(i+1)%ring.length];
      if((a.x<=x&&x<b.x)||(b.x<=x&&x<a.x))ys.push(a.y+(x-a.x)*(b.y-a.y)/(b.x-a.x));
    }
    ys.sort((a,b)=>a-b);const result=[];
    for(let i=0;i+1<ys.length;i+=2)if(ys[i+1]>ys[i])result.push([ys[i],ys[i+1]]);
    return result;
  };
  let result=0;
  for(let i=1;i<breaks.length;i++) {
    const width=breaks[i]-breaks[i-1];if(width<=1e-10)continue;
    const x=(breaks[i]+breaks[i-1])/2,clips=intervals(outer,x),spans=holes.flatMap(ring=>intervals(ring,x)).sort((a,b)=>a[0]-b[0]),merged=[];
    for(const span of spans){const prior=merged.at(-1);if(prior&&span[0]<=prior[1])prior[1]=Math.max(prior[1],span[1]);else merged.push([...span]);}
    let length=0;
    for(const [a,b]of clips)for(const [c,d]of merged)length+=Math.max(0,Math.min(b,d)-Math.max(a,c));
    result+=length*width;
  }
  return Math.min(area(outer),result);
}
function getHoles(item) {return [...(item.holes||[]),...Object.values(item.subzones||{}),...(item.fixtureCuts||[]).map(c=>c.points)];}
function insideItem(point,item) {
  return inside(point,item.points)&&!getHoles(item).some(hole=>inside(point,hole));
}
function onRing(point,ring) {
  return ring.some((p,i)=>distanceToSegment(point,p,ring[(i+1)%ring.length])<.25);
}
function cross(a,b,c) {return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function segmentsCross(a,b,c,d) {
  return cross(a,b,c)*cross(a,b,d)<-1e-7&&cross(c,d,a)*cross(c,d,b)<-1e-7;
}
function ringsCross(a,b) {
  return a.some((p,i)=>b.some((q,j)=>segmentsCross(p,a[(i+1)%a.length],q,b[(j+1)%b.length])));
}
function validPolygon(points) {
  if(points.length<3||!points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))||area(points)<1)return false;
  return !points.some((p,i)=>points.some((q,j)=>j>i+1&&!(i===0&&j===points.length-1)&&segmentsCross(p,points[(i+1)%points.length],q,points[(j+1)%points.length])));
}
function containsRing(parent,ring) {
  return ring.every(p=>insideItem(p,parent)||onRing(p,parent.points))&&!ringsCross(parent.points,ring)&&
    !getHoles(parent).some(h=>ringsCross(h,ring)||inside(h[0],ring));
}
function boundsOf(points) {
  return {x:Math.min(...points.map(p=>p.x)),y:Math.min(...points.map(p=>p.y)),
    right:Math.max(...points.map(p=>p.x)),bottom:Math.max(...points.map(p=>p.y))};
}
function overlapItems(a,b) {
  const x=boundsOf(a.points),y=boundsOf(b.points);
  if(x.right<=y.x+.1||y.right<=x.x+.1||x.bottom<=y.y+.1||y.bottom<=x.y+.1)return false;
  if(ringsCross(a.points,b.points))return true;
  const probes=ring=>ring.flatMap((p,i)=>[p,{x:(p.x+ring[(i+1)%ring.length].x)/2,y:(p.y+ring[(i+1)%ring.length].y)/2}]);
  if(probes(a.points).some(p=>insideItem(p,b)&&!onRing(p,b.points)))return true;
  if(probes(b.points).some(p=>insideItem(p,a)&&!onRing(p,a.points)))return true;
  // Identical boundaries have no strictly interior vertices.
  return Math.abs(netArea(a)-netArea(b))<1&&a.points.every(p=>onRing(p,b.points));
}
function traceRing(context,points) {
  points.forEach((p,i)=>i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y));context.closePath();
}
function traceItem(context,item) {
  context.beginPath();traceRing(context,item.points);getHoles(item).forEach(ring=>traceRing(context,ring));
}
function clipItem(context,item) {
  context.beginPath();traceRing(context,item.points);context.clip();
  const bounds=boundsOf(item.points);
  for(const hole of getHoles(item)) {
    context.beginPath();context.rect(bounds.x-1,bounds.y-1,bounds.right-bounds.x+2,bounds.bottom-bounds.y+2);
    traceRing(context,hole);context.clip('evenodd');
  }
}
function normalizeName(text) {
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’]/g,"'").toUpperCase().trim();
}
function isBathroom(name) {
  return /^(?:(?:SALLE\s+(?:DE\s+BAINS?|D[' ]EAU))|S\.?\s*D\.?\s*B\.?|S\.?\s*D\.?\s*E\.?|SDB|BATH(?:ROOM)?|WC|W\.C\.)(?:\s*\d+[A-Z]?|\s*[-–:]\s*\w+)?$/i.test(normalizeName(name));
}
function isDwellingName(name) {
  return /^(?:[1-9]\d?\s*C\.?\s*C\.?|STD\.?|STUDIO(?:\s*\d{1,4}[A-Z]?)?|(?:LOGEMENT|APPARTEMENT|APP\.?|APPT\.?|UNITE)\s*(?:[-:#]\s*)?[A-Z]?\d{1,4}[A-Z]?)$/.test(normalizeName(name));
}
function spaceTypeFromName(name) {
  const text=normalizeName(name);
  if(isBathroom(text))return 'bathroom';
  if(isDwellingName(text))return 'dwelling';
  if(isRoomName(text)&&/^(?:CORRIDOR|CIRCULATION|HALL|VESTIBULE|ENTREE)(?:\b|\s)/.test(text))return 'circulation';
  return 'room';
}
function isRoomName(name) {
  const text=normalizeName(name);
  if(/DOIVENT|PREVOIR|SANS FENETRE|PROJECTION|INSTALLATION|VENTILATION|LIMITE STRUCTURE/.test(text))return false;
  return text.length<=56&&(isBathroom(text)||isDwellingName(text)||/^(?:CHAMBRE|BEDROOM|SALON|SEJOUR|CUISINE|KITCHEN|SALLE A MANGER|DINING|CORRIDOR|CIRCULATION|HALL|ENTREE|VESTIBULE|BUREAU|OFFICE|RECEPTION|AIRE OUVERTE|SALLE FAMILIALE|RANGEMENT|WALK[- ]?IN|BUANDERIE|LAVAGE|GARAGE|LOCAL MECANIQUE|SALLE MECANIQUE|SALLE \d)[A-Z0-9 '\-–.]*$/.test(text));
}
function isOpenLivingName(name) {
  return /^(?:SALON|SEJOUR|CUISINE|KITCHEN|SALLE A MANGER|DINING)\b/.test(normalizeName(name));
}
function distinctRoomLabels(labels) {
  return labels.filter((label,index)=>!labels.slice(0,index).some(prior=>normalizeName(prior.text)===normalizeName(label.text)&&
    Math.hypot(prior.cx-label.cx,prior.cy-label.cy)<Math.max(2,Math.min(prior.height||0,label.height||0)*.6)));
}
function joinedLabelRows(texts) {
  const rows=[];
  for(const text of texts.filter(t=>t.text.length<60&&t.width>t.height*.4)) {
    let row=rows.find(r=>Math.abs(r.cy-text.cy)<Math.min(r.height,text.height)*.35&&Math.abs(r.height-text.height)<Math.max(r.height,text.height)*.4);
    if(!row){row={cy:text.cy,height:text.height,items:[]};rows.push(row);}row.items.push(text);
  }
  const joined=[];
  for(const row of rows) {
    const ordered=row.items.sort((a,b)=>a.x-b.x);let group=[];
    const finish=()=>{if(group.length>1){const x=group[0].x,y=Math.min(...group.map(t=>t.y)),right=Math.max(...group.map(t=>t.x+t.width)),bottom=Math.max(...group.map(t=>t.y+t.height));joined.push({text:group.map(t=>t.text).join(' '),x,y,width:right-x,height:bottom-y,cx:(x+right)/2,cy:(y+bottom)/2});}group=[];};
    for(const t of ordered){if(group.length&&t.x-(group.at(-1).x+group.at(-1).width)>Math.max(6,row.height))finish();group.push(t);}finish();
  }
  return joined.filter(t=>isRoomName(t.text));
}

function extractSheetInfo(items,viewport,pageLabel='') {
  const v=viewport.transform||[PDF_RENDER_SCALE,0,0,-PDF_RENDER_SCALE,0,viewport.height];
  const convert=(x,y)=>({x:v[0]*x+v[2]*y+v[4],y:v[1]*x+v[3]*y+v[5]});
  const texts=items.filter(i=>i.str?.trim()&&i.transform).map(item=>{
    const t=item.transform,rawHeight=Math.hypot(t[2],t[3])||item.height||8,
      rawWidth=item.width||item.str.length*rawHeight*.5,
      ux=t[0]/(Math.hypot(t[0],t[1])||1),uy=t[1]/(Math.hypot(t[0],t[1])||1),
      vx=t[2]/rawHeight,vy=t[3]/rawHeight,
      corners=[[0,0],[rawWidth,0],[0,rawHeight],[rawWidth,rawHeight]].map(([w,h])=>convert(t[4]+ux*w+vx*h,t[5]+uy*w+vy*h)),
      b=boundsOf(corners);
    return {text:item.str.trim().replace(/\s+/g,' '),x:b.x,y:b.y,width:b.right-b.x,height:b.bottom-b.y,
      cx:(b.x+b.right)/2,cy:(b.y+b.bottom)/2};
  });
  const codes=texts.filter(t=>/^[A-Z]{1,3}[-.]?\d{2,4}(?:[.-]\d{1,2})?$/.test(t.text)&&t.cx>viewport.width*.65&&t.cy>viewport.height*.58)
    .sort((a,b)=>(b.height+20*b.cx/viewport.width+20*b.cy/viewport.height)-(a.height+20*a.cx/viewport.width+20*a.cy/viewport.height));
  const code=codes[0],titleCandidates=texts.filter(t=>t.text.length>6&&t.text.length<95&&
    /^(?:PLAN\b|D[EÉ]TAIL\b|[EÉ]L[EÉ]VATION\b|COUPES?\b|FINIS\b|TOITURE\b)/i.test(t.text)&&
    (!code||t.x>viewport.width*.70&&t.y<code.y&&code.y-t.y<viewport.height*.3));
  titleCandidates.sort((a,b)=>code?Math.abs(code.x-a.x)+Math.abs(code.y-a.y)*.3-(Math.abs(code.x-b.x)+Math.abs(code.y-b.y)*.3):b.height-a.height);
  const titleMarker=code&&texts.find(t=>/^TITRE\s*:?$/.test(t.text)&&t.cx>viewport.width*.7&&t.y<code.y&&code.y-t.y<viewport.height*.3);
  const title=titleMarker?texts.filter(t=>t.x>=titleMarker.x-5&&t.y>titleMarker.y&&t.y<titleMarker.y+70&&t.height>=10&&t.text.length>4&&!/^(?:CLIENT|[EÉ]CHELLE|DESSIN[EÉ])/i.test(t.text)).sort((a,b)=>a.y-b.y)[0]||titleCandidates[0]:titleCandidates[0];
  let titleText=title?.text||'';
  if(title&&/[\/&,]\s*$/.test(titleText)) {
    const extra=texts.find(t=>Math.abs(t.x-title.x)<8&&t.y>title.y+title.height*.6&&t.y<title.y+title.height*2.5);
    if(extra)titleText+=' '+extra.text;
  }
  const noteColumn=texts.filter(t=>t.x>viewport.width*.70&&/^(?:NOTE ARCHITECTURALE|NOTE STRUCTURE|NOTE SP[EÉ]CIFIQUE|L[EÉ]GENDE|SUP\.)/i.test(t.text));
  const contentRight=Math.min(code?code.x-viewport.width*.025:viewport.width,...noteColumn.map(t=>t.x-8));
  const joined=joinedLabelRows(texts),labelTexts=[...texts.filter(t=>!joined.some(j=>j.text.includes(t.text)&&t.cx>=j.x&&t.cx<=j.x+j.width&&Math.abs(t.cy-j.cy)<j.height*.4)),...joined];
  const labels=labelTexts.filter(t=>isRoomName(t.text)&&t.cx<contentRight&&t.cy>viewport.height*.06&&t.cy<viewport.height*.94);
  return {code:code?.text||(/^[A-Z].*\d/.test(pageLabel)?pageLabel:''),title:titleText,
    texts,labels,contentRight,width:viewport.width,height:viewport.height};
}

/* Close only gaps supported by aligned wall runs; open-plan spans above the
   selected door width remain open. No rectangular room approximation. */
function bridgeWallGaps(mask,width,height,gap) {
  if(gap<=0)return mask.slice();
  const out=mask.slice(),support=Math.max(5,Math.min(14,Math.round(gap*.16)));
  function scan(lines,length,at) {
    for(let line=0;line<lines;line++) {
      let priorEnd=-1,priorLength=0,pos=0;
      while(pos<length) {
        if(!mask[at(line,pos)]){pos++;continue;}
        const start=pos;while(pos<length&&mask[at(line,pos)])pos++;
        const run=pos-start;
        if(run>=support) {
          const size=start-priorEnd;
          if(priorLength>=support&&size>0&&size<=gap)for(let p=priorEnd;p<start;p++)out[at(line,p)]=1;
          priorEnd=pos;priorLength=run;
        }
      }
    }
  }
  scan(height,width,(row,col)=>row*width+col);scan(width,height,(col,row)=>row*width+col);
  return out;
}
function closeCracks(mask,width,height) {
  const dilated=new Uint8Array(mask.length),out=new Uint8Array(mask.length);
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++) {
    const p=y*width+x;
    dilated[p]=mask[p]||mask[p-1]||mask[p+1]||mask[p-width]||mask[p+width]||mask[p-width-1]||mask[p-width+1]||mask[p+width-1]||mask[p+width+1]?1:0;
  }
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++) {
    const p=y*width+x;
    out[p]=dilated[p]&&dilated[p-1]&&dilated[p+1]&&dilated[p-width]&&dilated[p+width]&&dilated[p-width-1]&&dilated[p-width+1]&&dilated[p+width-1]&&dilated[p+width+1]?1:0;
  }
  return out;
}
function rasterLine(mask,width,height,a,b,radius=1) {
  const steps=Math.ceil(Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y)));
  for(let n=0;n<=steps;n++) {
    const t=steps?n/steps:0,x=Math.round(a.x+(b.x-a.x)*t),y=Math.round(a.y+(b.y-a.y)*t);
    for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)if(x+dx>=0&&x+dx<width&&y+dy>=0&&y+dy<height)mask[(y+dy)*width+x+dx]=1;
  }
}
function segmentRooms(mask,width,height,minPixels=80) {
  const labels=new Int32Array(mask.length),queue=new Int32Array(mask.length),rooms=[];
  let id=0;
  for(let start=0;start<mask.length;start++) {
    if(mask[start]||labels[start])continue;
    id++;let read=0,write=1;queue[0]=start;labels[start]=id;
    let minX=width,minY=height,maxX=0,maxY=0,touchesEdge=false;
    while(read<write) {
      const p=queue[read++],x=p%width,y=(p-x)/width;
      minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
      if(x===0||y===0||x===width-1||y===height-1)touchesEdge=true;
      for(const next of [x>0?p-1:-1,x<width-1?p+1:-1,y>0?p-width:-1,y<height-1?p+width:-1])
        if(next>=0&&!mask[next]&&!labels[next]){labels[next]=id;queue[write++]=next;}
    }
    if(write>=minPixels&&!touchesEdge)rooms.push({id,pixels:write,x:minX,y:minY,right:maxX+1,bottom:maxY+1,start});
  }
  return {labels,rooms,width,height};
}
function componentRings(model,room,factor=1) {
  const {labels,width,height}=model,id=room.id,edges=new Map(),stride=width+1;
  const add=(a,b)=>{if(!edges.has(a))edges.set(a,[]);edges.get(a).push(b);};
  for(let y=room.y;y<room.bottom;y++)for(let x=room.x;x<room.right;x++) {
    const p=y*width+x;if(labels[p]!==id)continue;
    if(!y||labels[p-width]!==id)add(y*stride+x,y*stride+x+1);
    if(x===width-1||labels[p+1]!==id)add(y*stride+x+1,(y+1)*stride+x+1);
    if(y===height-1||labels[p+width]!==id)add((y+1)*stride+x+1,(y+1)*stride+x);
    if(!x||labels[p-1]!==id)add((y+1)*stride+x,y*stride+x);
  }
  const rings=[];
  while(edges.size) {
    const start=edges.keys().next().value;let current=start,previous=null,ring=[],guard=0;
    do {
      ring.push({x:current%stride,y:Math.floor(current/stride)});
      const exits=edges.get(current);if(!exits?.length)break;
      let index=0;
      if(exits.length>1&&previous!==null) {
        const px=current%stride-previous%stride,py=Math.floor(current/stride)-Math.floor(previous/stride);
        let best=-Infinity;
        exits.forEach((next,j)=>{const nx=next%stride-current%stride,ny=Math.floor(next/stride)-Math.floor(current/stride),score=(px*ny-py*nx)*2+(px*nx+py*ny);if(score>best){best=score;index=j;}});
      }
      const next=exits.splice(index,1)[0];if(!exits.length)edges.delete(current);
      previous=current;current=next;
    }while(current!==start&&++guard<width*height*4);
    if(current!==start)continue;
    ring=ring.filter((p,i)=>{const a=ring[(i+ring.length-1)%ring.length],b=ring[(i+1)%ring.length];return Math.abs(cross(a,p,b))>1e-9;});
    if(ring.length>=3)rings.push(ring.map(p=>({x:p.x/factor,y:p.y/factor})));
  }
  rings.sort((a,b)=>area(b)-area(a));
  return rings;
}
function componentAt(model,point,factor=1,radius=0) {
  const x=Math.floor(point.x*factor),y=Math.floor(point.y*factor),{width,height,labels}=model;
  if(x<0||y<0||x>=width||y>=height)return null;
  const direct=model.rooms.find(room=>room.id===labels[y*width+x]);if(direct)return direct;
  for(let d=1;d<=radius;d++)for(const [dx,dy]of [[d,0],[-d,0],[0,d],[0,-d],[d,d],[-d,-d],[d,-d],[-d,d]]) {
    const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=width||yy>=height)continue;
    const room=model.rooms.find(r=>r.id===labels[yy*width+xx]);if(room)return room;
  }
  return null;
}
function makeWallModel(image,info,settings,scale,dividers=[],roi=null) {
  const factor=Math.min(1,(settings.roomPrecision==='fast'?2000:2600)/Math.max(image.width,image.height)),width=Math.round(image.width*factor),height=Math.round(image.height*factor);
  const off=document.createElement('canvas');off.width=width;off.height=height;
  const context=off.getContext('2d',{willReadFrequently:true});context.fillStyle='#ffffff';context.fillRect(0,0,width,height);
  const wallDiagnostics={mode:settings.wallMode==='all'?'all':'structure'};
  const vectorCount=info?.vectorWalls?.length?drawWallPaths(context,info.vectorWalls,factor,settings.threshold,scale,info.texts,settings.doorInches,info.labels,wallDiagnostics.mode,wallDiagnostics):0;
  if(!vectorCount)context.drawImage(image,0,0,width,height);
  // Suppress readable PDF labels so letters cannot masquerade as wall fragments.
  for(const t of vectorCount?[]:info?.texts||[])if(t.height>0&&t.height<80&&t.width<width/factor*.35) {
    context.fillRect(Math.floor(t.x*factor)-1,Math.floor(t.y*factor)-1,Math.ceil(t.width*factor)+3,Math.ceil(t.height*factor)+3);
  }
  const pixels=context.getImageData(0,0,width,height).data,raw=new Uint8Array(width*height);
  for(let p=0;p<raw.length;p++)raw[p]=pixels[p*4]*.2126+pixels[p*4+1]*.7152+pixels[p*4+2]*.0722<settings.threshold?1:0;
  let mask=bridgeWallGaps(closeCracks(raw,width,height),width,height,Math.min(130,Math.round(settings.doorInches/12/scale*factor)));
  for(const divider of dividers)rasterLine(mask,width,height,...divider.points.map(p=>({x:p.x*factor,y:p.y*factor})),1);
  const maxRight=Math.min(width,Math.floor((roi?image.width:info?.contentRight||image.width)*factor));
  if(roi||maxRight<width)for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const outside=x>=maxRight||roi&&(x<roi.x*factor||y<roi.y*factor||x>=roi.right*factor||y>=roi.bottom*factor);
    // Outside stays open, never an artificial enclosing wall.
    if(outside)mask[y*width+x]=0;
  }
  const minPixels=Math.max(4,settings.minArea/(scale*scale)*factor*factor),model=segmentRooms(mask,width,height,minPixels);
  model.rooms=model.rooms.filter(r=>r.right-r.x>=2&&r.bottom-r.y>=2&&r.right<maxRight&&
    (roi?r.x>roi.x*factor&&r.y>roi.y*factor&&r.right<roi.right*factor&&r.bottom<roi.bottom*factor:
      r.x>width*.027&&r.y>height*.027&&r.right<width*.973&&r.bottom<height*.973));
  const result=splitNarrowPassages({...model,factor,mask,source:vectorCount?'vector':'raster',wallDiagnostics},info,scale,settings.doorInches);
  result.wallLayers=classifyWallBoundaries(result,info,scale);
  return result;
}
function roomCandidate(model,room,info,material,settings,scale) {
  const rings=simplifyRoomRings(componentRings(model,room,model.factor),model.factor),outer=rings[0];if(!outer)return null;
  const labels=(info?.labels||[]).filter(label=>componentAt(model,{x:label.cx,y:label.cy},model.factor,3)?.id===room.id);
  // PDF exports can overprint the same label. Separate occurrences of a
  // repeated dwelling name still describe multiple units, even if the text
  // itself is identical; do not silently accept their merged contour.
  const physicalLabels=distinctRoomLabels(labels);
  const names=[...new Set(physicalLabels.map(l=>l.text))],baths=names.filter(isBathroom),mixed=!!baths.length&&names.some(n=>!isBathroom(n));
  const dwellingLabels=physicalLabels.filter(label=>isDwellingName(label.text)).length,types=[...new Set(names.map(spaceTypeFromName))];
  const openLiving=names.every(name=>isOpenLivingName(name)||isDwellingName(name)),allCirculation=types.length===1&&types[0]==='circulation';
  const bathroom=!!baths.length&&!mixed,needsSeparation=mixed||dwellingLabels>1||names.length>1&&!openLiving&&!allCirculation;
  const spaceType=dwellingLabels===1&&openLiving?'dwelling':types.length===1?types[0]:'room';
  const holes=rings.slice(1).filter(r=>area(r)*scale*scale>=.01);
  const finishCodes=[...new Set((info?.texts||[]).filter(text=>componentAt(model,{x:text.cx,y:text.cy},model.factor,0)?.id===room.id).flatMap(text=>MATERIALS.filter(finish=>normalizeName(text.text)===normalizeName(finish.code)).map(finish=>finish.code)))];
  const item={kind:'area',points:outer,holes,name:names.join(' / ')||'Pièce détectée',material:finishCodes.length===1?finishCodes[0]:material,bathroom,spaceType,
    materialSource:finishCodes.length===1?'code du plan':'matériau actif',materialNeedsReview:finishCodes.length!==1,
    status:'à valider',method:'Contours intérieurs',mixedBathroom:mixed,needsSeparation,selected:!needsSeparation};
  if(item.bathroom)applyRecognizedFixtures(item,info||{},scale);
  item.qty=netArea(item)*scale*scale;if(settings.minArea&&area(item.points)*scale*scale<settings.minArea)return null;return item;
}

/* Adapter for the exact PDF.js 5.6.205 build embedded in this HTML. Its packed
   path representation is checked before use; unsupported PDFs use raster mode. */
function multiplyMatrix(a,b) {
  return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
}
function colorBrightness(color) {
  if(Array.isArray(color)||ArrayBuffer.isView(color)) {
    const values=[...color],maximum=Math.max(...values),factor=maximum<=1?255:1;
    return values.length===1?values[0]*factor:(.2126*values[0]+.7152*values[1]+.0722*values[2])*factor;
  }
  if(typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color))return 0;
  return .2126*parseInt(color.slice(1,3),16)+.7152*parseInt(color.slice(3,5),16)+.0722*parseInt(color.slice(5,7),16);
}
function extractWallPaths(list,viewport,collector=null) {
  const ops=pdfjsLib.OPS;if(!ops?.constructPath)return null;
  let state={matrix:[1,0,0,1,0,0],width:1,color:'#000000',fillColor:'#000000',dashed:false};const stack=[],paths=[];
  for(let n=0;n<list.fnArray.length;n++) {
    const op=list.fnArray[n],args=list.argsArray[n];
    if(op===ops.save){stack.push({...state,matrix:[...state.matrix]});continue;}
    if(op===ops.restore){state=stack.pop()||state;continue;}
    if(op===ops.transform){state.matrix=multiplyMatrix(state.matrix,args);continue;}
    if(op===ops.paintFormXObjectBegin){stack.push({...state,matrix:[...state.matrix]});if(args[0])state.matrix=multiplyMatrix(state.matrix,args[0]);continue;}
    if(op===ops.paintFormXObjectEnd){state=stack.pop()||state;continue;}
    if(op===ops.setLineWidth){state.width=args[0];continue;}
    if(op===ops.setStrokeRGBColor){state.color=args[0];continue;}
    if(op===ops.setFillRGBColor){state.fillColor=args[0];continue;}
    if(op===ops.setStrokeGray){state.color=[args[0]];continue;}
    if(op===ops.setFillGray){state.fillColor=[args[0]];continue;}
    if(op===ops.setDash){state.dashed=!!args[0]?.length;continue;}
    if(op===ops.setGState){for(const [key,value]of args[0]||[])if(key==='LW')state.width=value;continue;}
    if(op!==ops.constructPath)continue;
    const filled=[ops.fill,ops.eoFill,ops.fillStroke,ops.eoFillStroke,ops.closeFillStroke,ops.closeEOFillStroke].includes(args[0]),
      stroked=[ops.stroke,ops.closeStroke,ops.fillStroke,ops.eoFillStroke,ops.closeFillStroke,ops.closeEOFillStroke].includes(args[0]),
      fill=filled&&colorBrightness(state.fillColor)<=215,stroke=stroked&&!state.dashed&&colorBrightness(state.color)<=215;
    if(!fill&&!stroke)continue;
    const packed=args[1]?.[0];if(!Array.isArray(packed)&&!ArrayBuffer.isView(packed))continue;
    const matrix=multiplyMatrix(viewport.transform,state.matrix),width=state.width*Math.sqrt(Math.abs(matrix[0]*matrix[3]-matrix[1]*matrix[2]));
    if(!fill&&(width<.25||width<.55&&colorBrightness(state.color)>60)&&!collector?.zones?.length)continue;
    const path=[],point=(x,y)=>[matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]];
    let valid=true;
    for(let i=0;i<packed.length;) {
      const code=packed[i++];path.push(code);
      const pairs=code===0||code===1?1:code===2?3:code===3?2:code===4?0:-1;
      if(pairs<0){valid=false;break;}
      for(let j=0;j<pairs;j++){path.push(...point(packed[i],packed[i+1]));i+=2;}
    }
    if(valid&&path.length>3){const entry={width,path,brightness:colorBrightness(state.color),fill,fillBrightness:colorBrightness(state.fillColor),stroke,fillRule:[ops.eoFill,ops.eoFillStroke,ops.closeEOFillStroke].includes(args[0])?'evenodd':'nonzero'};keepFixturePath(collector,entry);if(fill||width>=.25&&!(width<.55&&entry.brightness>60))paths.push(entry);}
  }
  return paths.length?paths:null;
}
function lineSegments(paths,minimum,maximumBrightness) {
  const segments=[];
  for(const {path,width,brightness,stroke=true}of paths) {
    if(!stroke)continue;
    if(width<minimum||brightness>maximumBrightness||width<.55&&brightness>60)continue;
    let prior=null,start=null;
    const add=point=>{if(prior){const length=dist(prior,point);if(length>1)segments.push({a:prior,b:point,width,length,ux:(point.x-prior.x)/length,uy:(point.y-prior.y)/length});}prior=point;};
    for(let i=0;i<path.length;) {
      const code=path[i++];
      if(code===0){prior=start={x:path[i++],y:path[i++]};}
      else if(code===1)add({x:path[i++],y:path[i++]});
      else if(code===2){i+=4;prior={x:path[i++],y:path[i++]};}
      else if(code===3){i+=2;prior={x:path[i++],y:path[i++]};}
      else if(code===4&&start)add(start);
    }
  }
  return segments;
}
function pairedWallSegments(paths,threshold,scale,texts=[]) {
  const minimum=threshold===135?.55:threshold===215?.25:.27,
    maximumBrightness=threshold===135?80:threshold===215?160:110;
  const segments=lineSegments(paths,minimum,maximumBrightness),maxThickness=1.25/scale,minThickness=Math.max(1.5,1/12/scale);
  const dimensions=texts.filter(t=>t.text.length<45&&/\d.*['"′″]|\d\s*(?:po|pi)\b/i.test(t.text));
  return segments.filter((a,index)=>{
    if(a.length<Math.max(5,.5/scale))return false;
    if(a.width>=1.2||threshold===215)return true;
    if(dimensions.some(t=>{
      const vertical=t.height>t.width*1.8;
      if(vertical?Math.abs(a.uy)<.98:Math.abs(a.ux)<.98)return false;
      const dx=t.cx-a.a.x,dy=t.cy-a.a.y,along=dx*a.ux+dy*a.uy,distance=Math.abs(dx*a.uy-dy*a.ux),font=vertical?t.width:t.height;
      return along>=-font&&along<=a.length+font&&distance<Math.max(4,font*1.6);
    }))return false;
    return segments.some((b,j)=>{
      if(index===j||Math.abs(a.ux*b.ux+a.uy*b.uy)<.9995)return false;
      const dx=b.a.x-a.a.x,dy=b.a.y-a.a.y,separation=Math.abs(dx*a.uy-dy*a.ux);
      const p=dx*a.ux+dy*a.uy,q=(b.b.x-a.a.x)*a.ux+(b.b.y-a.a.y)*a.uy,
        overlap=Math.min(a.length,Math.max(p,q))-Math.max(0,Math.min(p,q));
      if(a.width<.55) {
        if(b.width<.55)return false;
        if(separation<.15/scale&&overlap>=-1/scale)return true;
        return separation>=minThickness&&separation<=.5/scale&&overlap>=Math.min(a.length*.4,1/scale);
      }
      if(separation<minThickness||separation>maxThickness)return false;
      return overlap>=Math.min(a.length*.5,1.5/scale);
    });
  });
}
/* A dark outline is not sufficient evidence for a wall. Keep the connected
   wall framework first, including paired faces and named enclosed rooms.
   An isolated, unlabelled outline nested in that framework is ambiguous
   furniture/detail geometry; the all-traits setting keeps it when needed. */
function structuralWallSegments(segments,labels=[],scale,mode='structure',anchors=[]) {
  if(mode==='all'||segments.length<2)return segments;
  const parent=segments.map((_,index)=>index),tolerance=Math.max(1.5,.06/scale),
    root=index=>{while(parent[index]!==index){parent[index]=parent[parent[index]];index=parent[index];}return index;},
    connect=(a,b)=>distanceToSegment(a.a,b.a,b.b)<=tolerance||distanceToSegment(a.b,b.a,b.b)<=tolerance||distanceToSegment(b.a,a.a,a.b)<=tolerance||distanceToSegment(b.b,a.a,a.b)<=tolerance||segmentsCross(a.a,a.b,b.a,b.b),
    near=(a,b)=>Math.max(a.a.x,a.b.x)+tolerance>=Math.min(b.a.x,b.b.x)&&Math.max(b.a.x,b.b.x)+tolerance>=Math.min(a.a.x,a.b.x)&&Math.max(a.a.y,a.b.y)+tolerance>=Math.min(b.a.y,b.b.y)&&Math.max(b.a.y,b.b.y)+tolerance>=Math.min(a.a.y,a.b.y);
  for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++)if(near(segments[i],segments[j])&&connect(segments[i],segments[j]))parent[root(i)]=root(j);
  const groups=new Map();
  segments.forEach((segment,index)=>{const id=root(index);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(segment);});
  const components=[...groups.values()].map(edges=>({edges,bounds:boundsOf(edges.flatMap(edge=>[edge.a,edge.b]))}));
  const paired=edge=>segments.some(other=>{
    if(edge===other||Math.abs(edge.ux*other.ux+edge.uy*other.uy)<.9995)return false;
    const dx=other.a.x-edge.a.x,dy=other.a.y-edge.a.y,separation=Math.abs(dx*edge.uy-dy*edge.ux),
      p=dx*edge.ux+dy*edge.uy,q=(other.b.x-edge.a.x)*edge.ux+(other.b.y-edge.a.y)*edge.uy,
      overlap=Math.min(edge.length,Math.max(p,q))-Math.max(0,Math.min(p,q));
    return separation>=Math.max(1.5,1/12/scale)&&separation<=1.25/scale&&overlap>=Math.min(edge.length*.5,1.5/scale);
  });
  const enclosed=(point,edges)=>{
    let left=false,right=false,above=false,below=false;
    for(const edge of edges){const a=edge.a,b=edge.b;
      if((a.y>point.y)!==(b.y>point.y)){const x=a.x+(point.y-a.y)*(b.x-a.x)/(b.y-a.y);if(x<point.x)left=true;else right=true;}
      if((a.x>point.x)!==(b.x>point.x)){const y=a.y+(point.x-a.x)*(b.y-a.y)/(b.x-a.x);if(y<point.y)above=true;else below=true;}
      if(left&&right&&above&&below)return true;
    }return false;
  };
  const kept=new Set();
  for(const component of components){
    const {edges,bounds}=component,center={x:(bounds.x+bounds.right)/2,y:(bounds.y+bounds.bottom)/2},
      labelled=labels.some(label=>isRoomName(label.text)&&label.cx>bounds.x&&label.cx<bounds.right&&label.cy>bounds.y&&label.cy<bounds.bottom&&enclosed({x:label.cx,y:label.cy},edges)),
      supported=edges.some(edge=>paired(edge)||anchors.some(anchor=>near(edge,anchor)&&connect(edge,anchor))),
      nested=components.some(other=>other!==component&&other.bounds.x<bounds.x-tolerance&&other.bounds.y<bounds.y-tolerance&&other.bounds.right>bounds.right+tolerance&&other.bounds.bottom>bounds.bottom+tolerance&&enclosed(center,other.edges))||enclosed(center,anchors);
    if(labelled||supported||!nested)edges.forEach(edge=>kept.add(edge));
  }
  return segments.filter(segment=>kept.has(segment));
}
/* Classify the faces that bound the detected floors. The exterior envelope
   faces the unbounded outside; corridor faces require a recognized label.
   This inspection layer never changes the room mask or takeoff quantities. */
function classifyWallBoundaries(model,info,scale) {
  const layers={exterior:[],interior:[],circulation:[]},outside=new Set(),corridors=new Set();
  const edgePixel=point=>{if(!model.mask[point]&&model.labels[point])outside.add(model.labels[point]);};
  for(let x=0;x<model.width;x++){edgePixel(x);edgePixel((model.height-1)*model.width+x);}
  for(let y=0;y<model.height;y++){edgePixel(y*model.width);edgePixel(y*model.width+model.width-1);}
  for(const label of info?.labels||[])if(spaceTypeFromName(label.text)==='circulation'){
    const room=componentAt(model,{x:label.cx,y:label.cy},model.factor,3);if(room)corridors.add(room.id);
  }
  for(const room of model.rooms)for(const ring of componentRings(model,room,1))for(let index=0;index<ring.length;index++){
    const a=ring[index],b=ring[(index+1)%ring.length],length=dist(a,b);if(!length)continue;
    // componentRings walks room pixels with the room on its right side.
    const nx=(b.y-a.y)/length,ny=-(b.x-a.x)/length,middle={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    let neighbor=null;
    for(let step=.75;step<=Math.max(4,3/scale*model.factor);step+=1){
      const x=Math.floor(middle.x+nx*step),y=Math.floor(middle.y+ny*step);
      if(x<0||y<0||x>=model.width||y>=model.height){neighbor=0;break;}
      const p=y*model.width+x;if(!model.mask[p]){neighbor=model.labels[p];break;}
    }
    const kind=neighbor===0||outside.has(neighbor)?'exterior':corridors.has(room.id)||corridors.has(neighbor)?'circulation':'interior';
    layers[kind].push({a:{x:a.x/model.factor,y:a.y/model.factor},b:{x:b.x/model.factor,y:b.y/model.factor}});
  }
  return layers;
}
function wallDoorBridges(segments,scale,doorInches) {
  if(!doorInches)return [];
  const maxGap=doorInches/12/scale,tolerance=Math.max(2,.25/scale),bridges=[];
  for(const a of segments)for(const [point,sign]of [[a.a,-1],[a.b,1]]) {
    let best=null,bestDistance=Infinity;
    for(const b of segments) {
      if(a===b||Math.abs(a.ux*b.ux+a.uy*b.uy)<.9995)continue;
      for(const [other,otherSign]of [[b.a,-1],[b.b,1]]) {
        if((a.ux*b.ux+a.uy*b.uy)*sign*otherSign>-.98)continue;
        const dx=other.x-point.x,dy=other.y-point.y,along=(dx*a.ux+dy*a.uy)*sign,perp=Math.abs(dx*a.uy-dy*a.ux);
        if(along>1&&along<=maxGap&&perp<=tolerance&&along+perp*2<bestDistance){best={a:point,b:other};bestDistance=along+perp*2;}
      }
    }
    if(best)bridges.push(best);
  }
  return bridges;
}
function drawWallPaths(context,paths,factor,threshold,scale,texts=[],doorInches=36,labels=null,wallMode='structure',diagnostics=null) {
  context.strokeStyle='#000000';context.lineCap='square';context.lineJoin='miter';
  const admitted=pairedWallSegments(paths,threshold,scale,texts),
    fills=paths.filter(entry=>entry.fill&&entry.fillBrightness<threshold),
    anchors=lineSegments(fills.map(entry=>({...entry,stroke:true,width:Math.max(entry.width||0,1.2),brightness:0})),0,255),
    segments=structuralWallSegments(admitted,labels||texts.filter(text=>isRoomName(text.text)),scale,wallMode,anchors);
  if(diagnostics)Object.assign(diagnostics,{admittedSegments:admitted.length,wallSegments:segments.length,ignoredSegments:admitted.length-segments.length});
  let filled=0;
  for(const entry of paths)if(entry.fill&&entry.fillBrightness<threshold) {
    context.beginPath();
    for(let i=0;i<entry.path.length;) {
      const code=entry.path[i++];
      if(code===0)context.moveTo(entry.path[i++]*factor,entry.path[i++]*factor);
      else if(code===1)context.lineTo(entry.path[i++]*factor,entry.path[i++]*factor);
      else if(code===2)context.bezierCurveTo(...entry.path.slice(i,i+=6).map(value=>value*factor));
      else if(code===3)context.quadraticCurveTo(...entry.path.slice(i,i+=4).map(value=>value*factor));
      else if(code===4)context.closePath();
    }
    context.fillStyle='#000000';context.fill(entry.fillRule||'nonzero');filled++;
  }
  for(const segment of segments) {
    context.lineWidth=Math.max(.95,segment.width*factor);context.beginPath();
    context.moveTo(segment.a.x*factor,segment.a.y*factor);context.lineTo(segment.b.x*factor,segment.b.y*factor);context.stroke();
  }
  context.lineWidth=1.4;
  for(const bridge of wallDoorBridges(segments,scale,doorInches)){context.beginPath();context.moveTo(bridge.a.x*factor,bridge.a.y*factor);context.lineTo(bridge.b.x*factor,bridge.b.y*factor);context.stroke();}
  return filled+segments.length;
}

/* Separate room cores through narrow openings, then restore each core to the
   inside face of the walls. Long corridors remain separate, unlabelled regions. */
function clearanceField(mask,width,height) {
  const field=new Int32Array(mask.length),limit=width+height;
  for(let p=0;p<mask.length;p++)field[p]=mask[p]?0:limit;
  for(let y=1;y<height;y++)for(let x=1;x<width-1;x++) {
    const p=y*width+x;if(!mask[p])field[p]=Math.min(field[p],field[p-1]+1,field[p-width]+1,field[p-width-1]+1,field[p-width+1]+1);
  }
  for(let y=height-2;y>=0;y--)for(let x=width-2;x>0;x--) {
    const p=y*width+x;if(!mask[p])field[p]=Math.min(field[p],field[p+1]+1,field[p+width]+1,field[p+width-1]+1,field[p+width+1]+1);
  }
  return field;
}
function splitNarrowPassages(model,info,scale,doorInches) {
  if(!doorInches||!info?.labels?.length)return model;
  const groups=new Map();
  for(const label of info.labels) {
    const room=componentAt(model,{x:label.cx,y:label.cy},model.factor,3);if(!room)continue;
    if(!groups.has(room.id))groups.set(room.id,[]);groups.get(room.id).push(label);
  }
  const radius=Math.max(2,Math.round(doorInches/24/scale*model.factor)+1),result={...model,labels:model.labels.slice(),rooms:[...model.rooms]};
  let nextId=model.labels.reduce((max,id)=>Math.max(max,id),0)+1;
  for(const room of model.rooms) {
    const roomLabels=distinctRoomLabels(groups.get(room.id)||[]),dwellingCount=roomLabels.filter(label=>isDwellingName(label.text)).length;
    if(roomLabels.length<2||dwellingCount<=1&&roomLabels.every(label=>isOpenLivingName(label.text)||isDwellingName(label.text))||
      roomLabels.every(label=>spaceTypeFromName(label.text)==='circulation'))continue;
    const width=room.right-room.x+2,height=room.bottom-room.y+2,mask=new Uint8Array(width*height).fill(1),offsetX=room.x-1,offsetY=room.y-1;
    for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++)if(model.labels[(y+offsetY)*model.width+x+offsetX]===room.id)mask[y*width+x]=0;
    const clearance=clearanceField(mask,width,height),coreMask=Uint8Array.from(clearance,d=>d>radius?0:1),cores=segmentRooms(coreMask,width,height,16);
    if(cores.rooms.length<2)continue;
    const coreIds=new Set(cores.rooms.map(r=>r.id)),labels=new Int32Array(mask.length),distance=new Int32Array(mask.length),queue=new Int32Array(mask.length);
    let read=0,write=0;
    for(let p=0;p<labels.length;p++)if(coreIds.has(cores.labels[p])){labels[p]=cores.labels[p];queue[write++]=p;}
    while(read<write) {
      const p=queue[read++],x=p%width,y=(p-x)/width;if(distance[p]>=radius)continue;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
        if(!dx&&!dy||x+dx<1||x+dx>=width-1||y+dy<1||y+dy>=height-1)continue;
        const q=(y+dy)*width+x+dx;
        if(mask[q]||labels[q]||dx&&dy&&(mask[y*width+x+dx]||mask[(y+dy)*width+x]))continue;
        labels[q]=labels[p];distance[q]=distance[p]+1;queue[write++]=q;
      }
    }
    const remaining=segmentRooms(Uint8Array.from(mask,(blocked,p)=>blocked||labels[p]?1:0),width,height,16),usedIds=new Map();
    // Restoring room cores can leave a short doorway neck as its own
    // component. If that unlabelled neck joins two cores and exactly one is
    // a labelled corridor, retain it in the continuous corridor. A labelled
    // narrow room, a dead-end closet and ambiguous junctions stay separate.
    const circulationCores=new Set(),labelledRest=new Set(),adjacentCores=new Map(),restToCore=new Map();
    for(const label of groups.get(room.id)||[]) {
      const x=Math.floor(label.cx*model.factor)-offsetX,y=Math.floor(label.cy*model.factor)-offsetY;
      if(x<0||y<0||x>=width||y>=height)continue;
      const p=y*width+x;
      if(labels[p]&&spaceTypeFromName(label.text)==='circulation')circulationCores.add(labels[p]);
      else if(!labels[p]&&remaining.labels[p])labelledRest.add(remaining.labels[p]);
    }
    if(circulationCores.size) {
      for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++) {
        const p=y*width+x,id=remaining.labels[p];if(mask[p]||labels[p]||!id)continue;
        if(!adjacentCores.has(id))adjacentCores.set(id,new Set());
        for(const next of [p-1,p+1,p-width,p+width])if(labels[next])adjacentCores.get(id).add(labels[next]);
      }
      for(const [id,neighbors]of adjacentCores) {
        const corridors=[...neighbors].filter(core=>circulationCores.has(core));
        if(!labelledRest.has(id)&&neighbors.size>=2&&corridors.length===1)restToCore.set(id,corridors[0]);
      }
    }
    for(let p=0;p<labels.length;p++)if(!mask[p]) {
      const core=labels[p]||restToCore.get(remaining.labels[p]),local=core?'core:'+core:'rest:'+remaining.labels[p];
      if(!usedIds.has(local))usedIds.set(local,nextId++);
      result.labels[(Math.floor(p/width)+offsetY)*model.width+p%width+offsetX]=usedIds.get(local);
    }
    const stats=new Map(),globalIds=new Set(usedIds.values());
    for(let y=room.y;y<room.bottom;y++)for(let x=room.x;x<room.right;x++) {
      const p=y*model.width+x,id=result.labels[p];if(!globalIds.has(id))continue;
      if(!stats.has(id))stats.set(id,{id,pixels:0,x,y,right:x+1,bottom:y+1,start:p});
      const stat=stats.get(id);stat.pixels++;stat.x=Math.min(stat.x,x);stat.y=Math.min(stat.y,y);stat.right=Math.max(stat.right,x+1);stat.bottom=Math.max(stat.bottom,y+1);
    }
    result.rooms=result.rooms.filter(r=>r.id!==room.id).concat([...stats.values()].filter(r=>r.pixels>=16));
  }
  return result;
}

async function inspectPdfScale(page,withWalls=false) {
  try {
    const content=await page.getTextContent(),text=pdfTextLines(content.items),viewport=page.getViewport({scale:PDF_RENDER_SCALE}),
      scaleInfo=parseScaleText(text),sheet=extractSheetInfo(content.items,viewport),collector=fixtureCollector(sheet,scaleInfo);
    let vectorWalls=null;
    if(withWalls)try{vectorWalls=extractWallPaths(await page.getOperatorList(),viewport,collector);}catch{}
    return {...scaleInfo,...sheet,hasText:!!text.trim(),vectorWalls,vectorFixtures:collector.symbols};
  }catch{return {candidates:[],ambiguous:false,hasText:false,labels:[],texts:[],readError:true};}
}

/* Exact straight-line scissors. The source polygons and exclusions are never mutated. */
const SPLIT_EPSILON=1e-8;
function splitCleanRing(points) {
  let ring=points.map(point=>({x:point.x,y:point.y})).filter((point,index,all)=>!index||dist(point,all[index-1])>SPLIT_EPSILON);
  if(ring.length>1&&dist(ring[0],ring.at(-1))<=SPLIT_EPSILON)ring.pop();
  let changed=true;
  while(changed&&ring.length>3){changed=false;ring=ring.filter((point,index)=>{
    const before=ring[(index+ring.length-1)%ring.length],after=ring[(index+1)%ring.length];
    if(distanceToSegment(point,before,after)<=SPLIT_EPSILON){changed=true;return false;}return true;
  });}
  if(signedArea(ring)<0)ring.reverse();return ring;
}
function splitRingHalfPlane(source,a,unit,side) {
  const ring=splitCleanRing(source),signed=point=>(unit.x*(point.y-a.y)-unit.y*(point.x-a.x))*side,
    along=point=>(point.x-a.x)*unit.x+(point.y-a.y)*unit.y,events=[];
  const addEvent=point=>events.push({point:{x:point.x,y:point.y},t:along(point)});
  for(let i=0;i<ring.length;i++){
    const p=ring[i],q=ring[(i+1)%ring.length],dp=signed(p),dq=signed(q);
    if(Math.abs(dp)<=SPLIT_EPSILON)addEvent(p);
    if(dp>SPLIT_EPSILON&&dq<-SPLIT_EPSILON||dp<-SPLIT_EPSILON&&dq>SPLIT_EPSILON){const t=dp/(dp-dq);addEvent({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t});}
  }
  events.sort((p,q)=>p.t-q.t);
  const ordered=[];for(const event of events)if(!ordered.length||event.t-ordered.at(-1).t>SPLIT_EPSILON)ordered.push(event);
  const canonical=point=>Math.abs(signed(point))<=SPLIT_EPSILON*4?(ordered.find(event=>Math.abs(event.t-along(point))<=SPLIT_EPSILON*4)?.point||point):point;
  const nodes=new Map(),edges=[];
  const node=point=>{point=canonical(point);const key=point.x+','+point.y;if(!nodes.has(key))nodes.set(key,{point:{...point},out:[]});return nodes.get(key);};
  const addEdge=(p,q)=>{
    if(dist(p,q)<=SPLIT_EPSILON)return;
    const from=node(p),to=node(q);if(from===to||from.out.some(edge=>edge.to===to))return;
    const edge={from,to,used:false};from.out.push(edge);edges.push(edge);
  };
  for(let i=0;i<ring.length;i++){
    const p=ring[i],q=ring[(i+1)%ring.length],dp=signed(p),dq=signed(q),pIn=dp>=-SPLIT_EPSILON,qIn=dq>=-SPLIT_EPSILON;
    if(Math.abs(dp)<=SPLIT_EPSILON&&Math.abs(dq)<=SPLIT_EPSILON){
      if(((q.x-p.x)*unit.x+(q.y-p.y)*unit.y)*side>0)addEdge(p,q);
    }else if(pIn&&qIn)addEdge(p,q);
    else if(pIn!==qIn){const t=dp/(dp-dq),cut={x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t};if(pIn)addEdge(p,cut);else addEdge(cut,q);}
  }
  for(let i=1;i<ordered.length;i++){
    const p=ordered[i-1].point,q=ordered[i].point,middle={x:(p.x+q.x)/2,y:(p.y+q.y)/2};
    if(!inside(middle,ring)||ring.some((point,index)=>distanceToSegment(middle,point,ring[(index+1)%ring.length])<=SPLIT_EPSILON))continue;
    if(side>0)addEdge(p,q);else addEdge(q,p);
  }
  const rings=[];
  for(const first of edges){
    if(first.used)continue;
    let current=first,trail=[],positions=new Map(),guard=0;
    while(current&&!current.used&&guard++<=edges.length+1){
      current.used=true;
      if(!trail.length){trail.push(current.from);positions.set(current.from,0);}
      const to=current.to;
      if(positions.has(to)){
        const index=positions.get(to),cycle=trail.slice(index).map(entry=>entry.point),clean=splitCleanRing(cycle);
        if(clean.length>=3&&area(clean)>1e-10)rings.push(clean);
        for(const entry of trail.slice(index+1))positions.delete(entry);trail=trail.slice(0,index+1);
      }else{positions.set(to,trail.length);trail.push(to);}
      const incoming={x:current.to.point.x-current.from.point.x,y:current.to.point.y-current.from.point.y};
      const exits=to.out.filter(edge=>!edge.used);
      exits.sort((left,right)=>{
        const turn=edge=>{const dx=edge.to.point.x-to.point.x,dy=edge.to.point.y-to.point.y;return Math.atan2(incoming.x*dy-incoming.y*dx,incoming.x*dx+incoming.y*dy);};
        return turn(right)-turn(left);
      });
      current=exits[0]||null;
    }
    if(trail.length>1)throw new Error('La coupe produit un contour ambigu. Déplacez légèrement la droite.');
  }
  return rings;
}
function splitSurfaceByLine(item,a,b) {
  if(!item||!Array.isArray(item.points)||!validPolygon(item.points))throw new Error('La surface à découper est invalide.');
  if(![a,b].every(point=>point&&Number.isFinite(point.x)&&Number.isFinite(point.y))||dist(a,b)<=SPLIT_EPSILON)throw new Error('Choisissez deux points distincts pour la droite de coupe.');
  const length=dist(a,b),unit={x:(b.x-a.x)/length,y:(b.y-a.y)/length},holes=getHoles(item),parts=[];
  for(const side of [1,-1]){
    const outers=splitRingHalfPlane(item.points,a,unit,side),cuts=holes.flatMap(hole=>splitRingHalfPlane(hole,a,unit,side));
    for(const outer of outers){
      if(!validPolygon(outer))throw new Error('Un morceau serait trop petit ou invalide. Déplacez la droite de coupe.');
      const exclusions=cuts.filter(hole=>area(outer)-netArea({points:outer,holes:[hole]})>1e-9);
      // Source exclusions that extend outside the room require a general
      // polygon intersection. Do not silently turn them into invalid holes.
      if(exclusions.some(hole=>hole.some(point=>!inside(point,outer)&&!outer.some((p,index)=>distanceToSegment(point,p,outer[(index+1)%outer.length])<=SPLIT_EPSILON*4))))throw new Error('Corrigez les exclusions qui dépassent le contour avant la coupe.');
      const part={points:outer,holes:exclusions};if(netArea(part)>1e-9)parts.push(part);
    }
  }
  if(parts.length<2)throw new Error('La droite doit traverser la surface et créer au moins deux morceaux.');
  const before=netArea(item),after=parts.reduce((sum,part)=>sum+netArea(part),0);
  if(Math.abs(before-after)>1e-7)throw new Error('La coupe ne conserve pas exactement la surface nette. Corrigez les contours.');
  return parts;
}

/* V7 takeoff workflow. All analysis stays in the browser. */
const SPACE_STYLES={
  dwelling:{label:'Logement',color:'#587e18',fill:'#bfe86a66'},
  bathroom:{label:'Salle de bain',color:'#167c85',fill:'#52d8de66'},
  circulation:{label:'Corridor',color:'#a9348c',fill:'#ed7ad266'},
  room:{label:'Autre espace',color:'#526f76',fill:'#a8c9d14d'}
};
function surfaceSpaceType(item) {
  if(Object.hasOwn(SPACE_STYLES,item.spaceType))return item.spaceType;
  if(item.bathroom||isBathroom(item.name))return 'bathroom';
  return spaceTypeFromName(item.name);
}
function surfaceColorForItem(item) {
  return S.settings.surfaceDisplay==='materials'?mat(item.material).color:SPACE_STYLES[surfaceSpaceType(item)].color;
}
function surfaceFillForItem(item) {
  return S.settings.surfaceDisplay==='materials'?mat(item.material).color+'44':SPACE_STYLES[surfaceSpaceType(item)].fill;
}
function refreshSurfaceLegend() {
  const legend=$('#surfaceLegend');if(!legend)return;
  // Keep plan coordinates stable while the first measured surface is added.
  legend.hidden=!S.plan;
  $('#surfaceDisplay').value=S.settings.surfaceDisplay==='materials'?'materials':'spaces';
  $('#surfaceLabels').checked=!!S.settings.surfaceLabels;
  $('#spaceLegendKeys').hidden=S.settings.surfaceDisplay==='materials';
}
function initSurfaceLegend() {
  $('.stagebar').insertAdjacentHTML('afterend',`<section id="surfaceLegend" class="surface-legend" aria-label="Affichage des surfaces" hidden><label>Couleurs <select id="surfaceDisplay"><option value="spaces">Espaces</option><option value="materials">Revêtements</option></select></label><div id="spaceLegendKeys" class="space-legend-keys">${Object.values(SPACE_STYLES).map(style=>`<span><i style="--space-color:${style.color};--space-fill:${style.fill}"></i>${style.label}</span>`).join('')}</div><label class="surface-labels"><input id="surfaceLabels" type="checkbox"> Surfaces</label><span class="surface-legend-note">Repérage · finis à vérifier</span></section>`);
  $('#surfaceDisplay').onchange=event=>{S.settings.surfaceDisplay=event.target.value;save();refresh();};
  $('#surfaceLabels').onchange=event=>{S.settings.surfaceLabels=event.target.checked;save();refresh();};
  $('#surfaceLegend').insertAdjacentHTML('beforeend','<div id="wallLegend" class="wall-legend" hidden><span>Murs retenus · à vérifier</span><b style="--wall-color:#9b3b20">Extérieurs</b><b style="--wall-color:#245a9c">Intérieurs</b><b style="--wall-color:#a9348c">Corridors</b></div>');
}
function toggleWallInspection() {
  if(!S.plan)return toast('Ouvrez un plan pour examiner les murs.');
  if(!S.scale)return calibrationModal();
  S.settings.showWalls=!S.settings.showWalls;
  if(S.settings.showWalls)detectorForPage();
  save();refresh();
}
function drawWallInspection(context) {
  if(!S.plan||!S.scale||!S.settings.showWalls)return;
  const layers=detectorForPage().wallLayers;if(!layers)return;
  context.save();context.lineWidth=2.5/S.zoom;context.setLineDash([]);
  for(const [name,color]of [['exterior','#9b3b20'],['interior','#245a9c'],['circulation','#a9348c']]) {
    context.beginPath();
    for(const segment of layers[name]||[]){context.moveTo(segment.a.x,segment.a.y);context.lineTo(segment.b.x,segment.b.y);}
    context.strokeStyle=color;context.stroke();
  }
  context.restore();
}
const surfaceLabelAnchors=new WeakMap();
function surfaceLabelAnchor(item,halfWidth,halfHeight) {
  const old=surfaceLabelAnchors.get(item),b=boundsOf(item.points),
    texts=(S.pageInfo[item.page||S.page]?.texts||[]).filter(text=>text.x<=b.right&&text.x+text.width>=b.x&&text.y<=b.bottom&&text.y+text.height>=b.y),
    key=[item.qty,b.x,b.y,b.right,b.bottom,halfWidth,halfHeight,texts.length].join(':');
  if(old?.key===key)return old.point;
  let best=null,clearance=-1;
  const probes=[{x:(b.x+b.right)/2,y:(b.y+b.bottom)/2}];
  for(let y=1;y<8;y++)for(let x=1;x<8;x++)probes.push({x:b.x+(b.right-b.x)*x/8,y:b.y+(b.bottom-b.y)*y/8});
  for(const point of probes)if(insideItem(point,item)&&!texts.some(text=>point.x-halfWidth<text.x+text.width+2/S.zoom&&point.x+halfWidth>text.x-2/S.zoom&&point.y-halfHeight<text.y+text.height+2/S.zoom&&point.y+halfHeight>text.y-2/S.zoom)) {
    let nearest=Infinity;
    for(const ring of [item.points,...getHoles(item)])for(let i=0;i<ring.length;i++)nearest=Math.min(nearest,distanceToSegment(point,ring[i],ring[(i+1)%ring.length]));
    if(nearest>clearance){clearance=nearest;best=point;}
  }
  surfaceLabelAnchors.set(item,{key,point:best});return best;
}
function drawSurfaceLabel(context,item,force=false,occupied=[]) {
  const label=hasPendingFixtures(item)?'À délimiter':fmt(item.qty)+' pi²';
  context.save();context.font=`600 ${11/S.zoom}px Arial`;context.textAlign='center';context.textBaseline='middle';
  const halfWidth=(context.measureText(label).width/2)+5/S.zoom,halfHeight=9/S.zoom,
    point=surfaceLabelAnchor(item,halfWidth,halfHeight);
  if(!point){context.restore();return;}
  const rect={x:point.x-halfWidth,y:point.y-halfHeight,right:point.x+halfWidth,bottom:point.y+halfHeight};
  const corners=[{x:rect.x,y:rect.y},{x:rect.right,y:rect.y},{x:rect.right,y:rect.bottom},{x:rect.x,y:rect.bottom}];
  if(!force&&(!corners.every(p=>insideItem(p,item))||occupied.some(other=>rect.x<other.right&&rect.right>other.x&&rect.y<other.bottom&&rect.bottom>other.y))){context.restore();return;}
  context.setLineDash([]);context.fillStyle='#ffffffeb';context.fillRect(rect.x,rect.y,halfWidth*2,halfHeight*2);
  context.strokeStyle=surfaceColorForItem(item);context.lineWidth=1/S.zoom;context.strokeRect(rect.x,rect.y,halfWidth*2,halfHeight*2);
  context.fillStyle='#192b22';context.fillText(label,point.x,point.y);context.restore();occupied.push(rect);
}
function drawSurfaceLabels(context) {
  if(!S.settings.surfaceLabels)return;
  const occupied=[],preview=S.preview?.page===S.page?S.preview.items.filter(item=>!item.duplicate):[],
    items=[...S.items.filter(item=>item.page===S.page&&item.kind==='area'),...preview];
  for(const item of items)drawSurfaceLabel(context,item,false,occupied);
}
function confirmationIssues(item) {
  const reasons=[];
  if (item.kind!=='count'&&(!S.scales[item.page] || !S.scaleMeta[item.page]?.verified)) reasons.push('échelle à vérifier');
  if (hasPendingFixtures(item)) reasons.push('bain ou douche à délimiter');
  if (item.materialNeedsReview) reasons.push('revêtement à choisir');
  if (!Number.isFinite(item.qty) || item.qty<=0) reasons.push('quantité non positive');
  reasons.push(...wallTakeoffIssues(item));
  return reasons;
}
function isConfirmed(item) {
  return item.status==='confirmée' && confirmationIssues(item).length===0;
}
function confirmSelected() {
  const items=S.items.filter(item=>S.selection.has(item.id)&&item.page===S.page);
  if (!items.length) return toast('Sélectionnez les mesures à confirmer dans le tableau.');
  const blocked=items.find(item=>confirmationIssues(item).length);
  if (blocked) return toast(`${blocked.name} : ${confirmationIssues(blocked).join(' · ')}.`);
  remember();
  for (const item of items) item.status='confirmée';
  save();refresh();
  toast(`${items.length} mesure(s) confirmée(s). Les cotes restent exclues des commandes.`);
}
function closeReview() {
  S.reviewOpen=false;S.preview=null;S.previewFocus=null;
  $('#reviewPanel').hidden=true;
  $('.app').classList.remove('review-open');
  $('#inspector').hidden=innerWidth<780;
  refreshWorkflow();
}
function refreshWorkflow() {
  if (!$('#stepDetect')) return;
  const areas=S.items.filter(item=>item.kind==='area'&&!hasPendingFixtures(item));
  const confirmed=areas.filter(isConfirmed).reduce((sum,item)=>sum+item.qty,0);
  const proposed=areas.filter(item=>!isConfirmed(item)).reduce((sum,item)=>sum+item.qty,0);
  $('#confirmedTotal').textContent=fmt(confirmed)+' pi²';
  $('#proposedTotal').textContent=fmt(proposed)+' pi²';
  const steps=[!!S.plan,!!S.reviewByPage?.[S.page]||S.items.length>0,S.items.length>0&&S.items.every(isConfirmed)];
  ['stepOpen','stepDetect','stepReview'].forEach((id,index)=>$('#'+id).classList.toggle('complete',steps[index]));
  $('#stepDetect').disabled=!S.plan||S.loading||!!S.detectJob;
  $('#stepReview').disabled=!S.items.length&&!Object.keys(S.reviewByPage||{}).length;
  $('#confirmSelection').disabled=!S.selection.size||!!S.detectJob;
  $('#confirmSelection').textContent=S.selection.size>1?`Confirmer ${S.selection.size} mesures`:'Confirmer la sélection';
  const unadded=Object.values(S.reviewByPage||{}).flatMap(pack=>pack.items).filter(item=>!candidateAlreadyMeasured(item)).length;
  $('#reviewCount').textContent=String(S.items.filter(item=>!isConfirmed(item)).length+unadded);
  if (S.reviewOpen) renderDetectionPanel();
  refreshSurfaceLegend();
  $('#wallLegend').hidden=!S.settings.showWalls;
}
function previewCandidate(index) {
  const pack=S.reviewByPage[S.page],item=pack?.items[index];if(!item)return;
  setSelection([]);S.tool='select';S.draft=[];S.previewFocus=index;
  const b=boundsOf(item.points),w=canvas.clientWidth,h=canvas.clientHeight;
  S.zoom=Math.max(.02,Math.min(12,(w-80)/Math.max(b.right-b.x,20),(h-80)/Math.max(b.bottom-b.y,20)));
  S.pan={x:(w-(b.right+b.x)*S.zoom)/2,y:(h-(b.bottom+b.y)*S.zoom)/2};
  $$('[data-preview]').forEach(button=>button.setAttribute('aria-pressed',String(+button.dataset.preview===index)));
  $('#zoomText').textContent=fmt(S.zoom*100,0)+' %';
  refreshManualUI();
}
function renderDetectionPanel() {
  const panel=$('#reviewPanel'),pack=S.reviewByPage?.[S.page];
  if(!panel||!S.reviewOpen)return;
  const firstOpen=!$('.app').classList.contains('review-open');
  panel.hidden=false;$('#inspector').hidden=true;$('.app').classList.add('review-open');
  if(firstOpen&&S.previewFocus===null)fitPlan();
  const candidates=pack?.items||[];
  for(const candidate of candidates) {
    candidate.duplicate=candidateAlreadyMeasured(candidate);
    if(candidate.duplicate)candidate.selected=false;
  }
  S.preview={page:S.page,items:candidates};
  const pages=Object.keys(S.reviewByPage).map(Number).sort((a,b)=>a-b);
  const notes=S.detectionNotes||[];
  panel.innerHTML=`<header class="review-head"><div><span>RELEVÉ AUTOMATIQUE</span><h2>Réviser les pièces</h2></div><button type="button" id="closeReview" aria-label="Fermer la révision">×</button></header>
    <div class="review-intro"><p>${candidates.length} proposition(s) · ${esc(pageName(S.page))}</p><p>Affichez un contour, vérifiez son fini, puis ajoutez-le au relevé. La confirmation se fait ensuite dans le tableau.</p>
    ${pages.length>1?`<label>Feuille analysée<select id="reviewPage">${pages.map(page=>`<option value="${page}" ${page===S.page?'selected':''}>${esc(pageName(page))}</option>`).join('')}</select></label>`:''}</div>
    <div class="review-scroll">${candidates.length?`<div class="detection-table"><table><thead><tr><th>Choix</th><th>Pièce et revêtement</th><th>Net</th></tr></thead><tbody>${candidates.map((item,index)=>`<tr data-review-candidate="${index}"><td><input type="checkbox" aria-label="Ajouter ${esc(item.name)}" data-candidate="${index}" ${item.selected?'checked':''} ${item.duplicate||item.needsSeparation?'disabled':''}></td><td><button type="button" class="review-name" data-preview="${index}" aria-pressed="${index===S.previewFocus}" aria-label="Afficher le contour de ${esc(item.name)}">${esc(item.name)} <span aria-hidden="true">Voir</span></button><label class="sr-only" for="candidateMaterial${index}">Fini de ${esc(item.name)}</label><select id="candidateMaterial${index}" data-candidate-material="${index}" ${item.duplicate?'disabled':''}>${item.materialNeedsReview?'<option value="">Choisir le revêtement</option>':''}${MATERIALS.map(material=>`<option value="${material.code}" ${!item.materialNeedsReview&&item.material===material.code?'selected':''}>${material.code} · ${esc(material.name)}</option>`).join('')}</select>
      ${item.duplicate?'<small class="review-ok">Déjà mesurée</small>':''}${item.needsSeparation?'<small class="review-warning">Pièces communicantes : fermez le passage et relancez.</small>':''}${item.unnamed?'<small>Zone sans nom : vérifier le contour.</small>':''}${item.materialNeedsReview?'<small>Le plan ne fournit pas de code de fini reconnu.</small>':''}${hasPendingFixtures(item)?'<small class="review-warning">Équipement à délimiter avant commande.</small>':''}${item.fixtureCuts?.length?`<small>${item.fixtureCuts.length} emprise(s) proposée(s) à contrôler.</small>`:''}</td><td>${fmt(item.qty)}<small>pi²</small></td></tr>`).join('')}</tbody></table></div>`:'<p class="review-empty">Aucune pièce fermée reconnue sur cette feuille. Fermez une ouverture ou limitez le cadre de détection.</p>'}
    ${notes.length?`<details class="review-notes" open><summary>Bilan des feuilles</summary><ul>${notes.map(note=>`<li>Page ${note.page} : ${esc(note.message)}</li>`).join('')}</ul></details>`:''}</div>
    <footer class="review-actions"><button type="button" class="primary" id="addCandidates" ${!candidates.some(item=>item.selected&&!item.duplicate&&!item.needsSeparation)?'disabled':''}>Ajouter au relevé · à valider</button><div><button type="button" id="retryDetection">Réglages</button><button type="button" id="correctDetection">Fermer un passage</button><button type="button" id="cancelDetection">Fermer</button></div></footer>`;
  $('#closeReview').onclick=$('#cancelDetection').onclick=closeReview;
  $('#retryDetection').onclick=openDetectionSettings;
  $('#correctDetection').onclick=()=>{closeReview();activateTool('divider');};
  if($('#reviewPage'))$('#reviewPage').onchange=async event=>{await showPage(+event.target.value);renderDetectionPanel();};
  $$('[data-preview]',panel).forEach(button=>button.onclick=()=>previewCandidate(+button.dataset.preview));
  $$('[data-candidate]',panel).forEach(input=>input.onchange=()=>{candidates[+input.dataset.candidate].selected=input.checked;$('#addCandidates').disabled=!candidates.some(item=>item.selected&&!item.duplicate&&!item.needsSeparation);});
  $$('[data-candidate-material]',panel).forEach(select=>select.onchange=()=>{const item=candidates[+select.dataset.candidateMaterial];if(select.value){item.material=select.value;item.materialNeedsReview=false;}});
  $('#addCandidates').onclick=()=>{
    if(pack?.key!==S.documentKey)return closeReview();
    const result=addDetected(candidates);renderDetectionPanel();
    if(result.skipped.length)toast(`${result.accepted} ajout(s) ; ${result.skipped.length} contour(s) à corriger.`);
    else toast(`${result.accepted} mesure(s) ajoutée(s), à valider avant commande.`);
  };
}
function openDetectionSettings() {
  if(!S.plan||S.loading)return toast('Ouvrez un plan avant de détecter les pièces.');
  if(!S.scale)return calibrationModal();
  openDialog('Détecter les pièces',`<form id="detectionForm"><p>Les faces et les connexions des murs délimitent d’abord les espaces. Le mode Structure filtre les réseaux isolés qui ressemblent à du mobilier. Vérifiez les murs retenus avec l’icône Murs, puis contrôlez les surfaces et les revêtements.</p>
    <div class="v4-fields"><label>Feuilles à analyser<select id="detectionScope"><option value="active">Feuille active · ${S.page}</option><option value="selected" ${S.pages===1?'disabled':''}>Choisir plusieurs feuilles</option></select></label><label>Fermer les ouvertures jusqu’à<select id="doorGap">${[0,24,30,36,42,48].map(n=>`<option value="${n}" ${n===S.settings.doorInches?'selected':''}>${n?n+' po':'Ne pas fermer'}</option>`).join('')}</select></label><label>Surface minimale (pi²)<input id="minRoomArea" type="number" min="1" max="500" step="any" value="${S.settings.minArea}"></label><label>Précision<select id="roomPrecision"><option value="fine" ${S.settings.roomPrecision!=='fast'?'selected':''}>Précise</option><option value="fast" ${S.settings.roomPrecision==='fast'?'selected':''}>Rapide</option></select></label><label>Lecture des traits<select id="wallThreshold">${[[135,'Traits foncés'],[180,'Standard'],[215,'Traits pâles']].map(([n,label])=>`<option value="${n}" ${n===S.settings.threshold?'selected':''}>${label}</option>`).join('')}</select></label></div>
    <label class="wall-mode-field">Lecture des murs<select id="wallMode"><option value="structure" ${S.settings.wallMode!=='all'?'selected':''}>Structure du bâtiment</option><option value="all" ${S.settings.wallMode==='all'?'selected':''}>Tous les traits admissibles</option></select></label>
    <fieldset id="detectionPages" class="detection-pages" hidden><legend>Feuilles du projet</legend>${Array.from({length:S.pages},(_,index)=>index+1).map(page=>`<label><input type="checkbox" data-detect-page="${page}" ${page===S.page?'checked':''}> ${esc(pageName(page))} <small>${S.scales[page]?(S.scaleMeta[page]?.verified?'Échelle vérifiée':'Échelle à vérifier'):'Sans échelle'}</small></label>`).join('')}</fieldset>
    <p class="scale-help">Le seuil des ouvertures est un réglage de fermeture, pas une mesure de porte. B permet une fermeture manuelle ; R limite l’analyse à un cadre. Un fini absent du plan devra être choisi.</p><p id="detectionError" class="v4-error" role="alert" hidden></p>
    <div class="modal-actions"><button type="button" id="removeDetectionFrame">Retirer le cadre</button><button type="submit" class="primary" id="runDetection">Détecter la feuille</button></div></form>`);
  $('#detectionScope').onchange=event=>{$('#detectionPages').hidden=event.target.value!=='selected';$('#runDetection').textContent=event.target.value==='selected'?'Détecter les feuilles choisies':'Détecter la feuille';};
  $('#removeDetectionFrame').onclick=()=>{remember();delete S.detectBounds[S.page];S.detectorCache=null;save();toast('Cadre retiré de la feuille active.');};
  $('#detectionForm').onsubmit=event=>{
    event.preventDefault();const minArea=Number($('#minRoomArea').value);
    const pages=$('#detectionScope').value==='active'?[S.page]:$$('[data-detect-page]:checked').map(input=>+input.dataset.detectPage);
    if(!Number.isFinite(minArea)||minArea<1||minArea>500||!pages.length){$('#detectionError').hidden=false;$('#detectionError').textContent='Choisissez au moins une feuille et une surface minimale de 1 à 500 pi².';return;}
    S.settings={...S.settings,minArea,roomPrecision:$('#roomPrecision').value,doorInches:+$('#doorGap').value,threshold:+$('#wallThreshold').value,wallMode:$('#wallMode').value};S.detectorCache=null;save();
    runDetectionPages(pages);
  };
}
async function detectionSource(pageNumber) {
  if(pageNumber===S.page&&S.plan)return {image:S.plan,info:S.pageInfo[pageNumber]||{}};
  const page=await S.pdf.getPage(pageNumber),viewport=page.getViewport({scale:PDF_RENDER_SCALE});
  const offscreen=document.createElement('canvas');offscreen.width=Math.ceil(viewport.width);offscreen.height=Math.ceil(viewport.height);
  const [,info]=await Promise.all([page.render({canvasContext:offscreen.getContext('2d'),viewport}).promise,inspectPdfScale(page,true)]);
  return {image:offscreen,info};
}
async function runDetectionPages(pages) {
  const job={cancelled:false,key:S.documentKey},notes=[];S.detectJob=job;S.detectionNotes=[];
  openDialog('Analyse des feuilles',`<p id="detectionProgress" role="status" aria-live="polite">Préparation…</p><progress id="detectionProgressBar" max="${pages.length}" value="0"></progress><p>L’arrêt prend effet entre deux feuilles. Les résultats déjà obtenus sont conservés.</p><button type="button" id="stopDetection">Arrêter après cette feuille</button>`);
  $('#stopDetection').onclick=()=>{job.cancelled=true;$('#stopDetection').disabled=true;$('#stopDetection').textContent='Arrêt demandé…';};
  const settings={...S.settings},material=S.material;
  for(let index=0;index<pages.length;index++) {
    const page=pages[index];if(job.cancelled||job.key!==S.documentKey)break;
    if($('#detectionProgress'))$('#detectionProgress').textContent=`Feuille ${index+1} sur ${pages.length} · ${pageName(page)}`;
    await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
    try {
      const {image,info}=await detectionSource(page);if(job.cancelled||job.key!==S.documentKey)break;
      S.pageInfo[page]=info;rememberSheet(page,info);
      if(!S.scales[page]&&info.candidates?.length===1&&!info.ambiguous){const candidate=info.candidates[0];S.scales[page]=candidate.feetPerInch/PDF_DPI;S.scaleMeta[page]={...candidate,source:'automatic',verified:false};}
      const scale=S.scales[page];
      if(!scale){notes.push({page,message:'Non analysée : calibre ou choisissez l’échelle de cette feuille.'});continue;}
      const model=makeWallModel(image,info,settings,scale,S.dividers[page]||[],S.detectBounds[page]);
      let candidates=model.rooms.map(room=>roomCandidate(model,room,info,material,settings,scale)).filter(Boolean);
      const hasNames=candidates.some(item=>item.name!=='Pièce détectée');
      candidates.sort((a,b)=>boundsOf(a.points).y-boundsOf(b.points).y||boundsOf(a.points).x-boundsOf(b.points).x);
      candidates=candidates.slice(0,150).map((candidate,n)=>({...candidate,page,unnamed:candidate.name==='Pièce détectée',selected:candidate.selected&&(!hasNames||candidate.name!=='Pièce détectée'),name:candidate.name==='Pièce détectée'?'Pièce détectée '+(n+1):candidate.name}));
      S.reviewByPage[page]={key:job.key,items:candidates};
      notes.push({page,message:`${candidates.length} proposition(s)${S.scaleMeta[page]?.verified?'':' · échelle à vérifier avant confirmation'}`});
    } catch(error){notes.push({page,message:'Analyse impossible : '+error.message});}
    finally{if($('#detectionProgressBar'))$('#detectionProgressBar').value=index+1;}
  }
  if(S.detectJob!==job)return;
  S.detectJob=null;if(job.key!==S.documentKey)return;
  S.detectionNotes=notes;closeDialog();
  const first=Object.keys(S.reviewByPage).map(Number).find(page=>pages.includes(page));
  if(first&&!S.reviewByPage[S.page])await showPage(first);
  S.reviewOpen=true;renderDetectionPanel();refreshWorkflow();save();
  if(job.cancelled)toast('Analyse arrêtée. Les propositions obtenues sont conservées.');
}
function initV7() {
  Object.assign(S,{reviewByPage:{},reviewOpen:false,detectionNotes:[],detectJob:null,previewFocus:null});
  $('.ribbon').insertAdjacentHTML('beforebegin',`<nav id="workflow" aria-label="Projet et détection"><button type="button" id="stepOpen"><i data-lucide="folder-open"></i><span>Ouvrir</span></button><button type="button" id="stepDetect"><i data-lucide="scan-line"></i><span>Détecter</span></button><button type="button" id="stepReview"><i data-lucide="list-checks"></i><span>Réviser</span><b id="reviewCount">0</b></button></nav>`);
  $('.quantity-grid').insertAdjacentHTML('beforebegin',`<section class="validation-bar" aria-label="Validation des surfaces"><div><span>Sol confirmé · net</span><strong id="confirmedTotal">0,0 pi²</strong></div><div><span>Sol à valider · net</span><strong id="proposedTotal">0,0 pi²</strong></div><button type="button" id="confirmSelection">Confirmer la sélection</button></section>`);
  $('#inspector').insertAdjacentHTML('beforebegin','<aside id="reviewPanel" class="review-panel" aria-label="Révision des pièces détectées" hidden></aside>');
  $('#stepOpen').onclick=()=>$('#fileInput').click();$('#stepDetect').onclick=analyzeAll;
  $('#stepReview').onclick=()=>{if(Object.keys(S.reviewByPage).length){S.reviewOpen=true;renderDetectionPanel();}else takeoffDrawer();};
  $('#confirmSelection').onclick=confirmSelected;
  $('#aiReview').onclick=$('#stepReview').onclick;
  const syncSmallScreen=()=>{if(innerWidth<780){$('#inspector').hidden=true;$('.app').classList.add('pages-folded');}if(S.reviewOpen)renderDetectionPanel();};
  window.addEventListener('resize',syncSmallScreen);syncSmallScreen();
  $('#projectName').placeholder='Nom du projet';
  $$('.menu button:not([id])').forEach(button=>button.remove());
  $('.side-tabs').remove();
  $('.brand').insertAdjacentHTML('beforeend','<small class="version-mark">V7</small>');
  initSurfaceLegend();
  lucide.createIcons({attrs:{width:18,height:18,'stroke-width':1.8}});
}

/* Manual takeoff tools share the same plan coordinates and history as auto takeoff. */
function unitForItem(item) {
  return item.kind==='count'?'u':item.kind==='area'||typeof isWallTakeoff==='function'&&isWallTakeoff(item)?'pi²':'pi';
}
function labelForItem(item) {
  if(typeof isWallTakeoff==='function'&&isWallTakeoff(item))return wallTakeoffLabel(item);
  return item.kind==='count'?'Comptage':item.measureOnly?'Cote de référence':item.kind==='area'?mat(item.material).name:'Plinthe / moulure';
}
function colorForItem(item) {
  if(typeof isWallTakeoff==='function'&&isWallTakeoff(item))return wallTakeoffColor(item);
  return item.kind==='count'?'#6846a3':item.measureOnly?'#25649a':item.kind==='area'?surfaceColorForItem(item):'#df5e43';
}
function manualButton(id,icon,label,title,tool='',tone='') {
  return `<button type="button" id="${id}" class="manual-button ${tone}" title="${title}" aria-label="${title}" ${tool?`data-manual-tool="${tool}" aria-pressed="false"`:''}><i data-lucide="${icon}" aria-hidden="true"></i><span>${label}</span></button>`;
}
function startManualTool(tool) {
  if(!S.plan)return toast('Ouvrez un plan avant de commencer le relevé manuel.');
  if(S.loading||S.detectJob)return;
  if(['area','rectangle','linear','segment','dimension','exclude'].includes(tool)&&!S.scale) {
    calibrationModal();
    return;
  }
  if(!['select','hand','exclude'].includes(tool)&&S.reviewOpen)closeReview();
  activateTool(tool);
}
function initManualUI() {
  if($('#manualRibbon'))return;
  const navigation=[
    manualButton('manualSelect','mouse-pointer-2','Sélection','Sélectionner les mesures · V','select'),
    manualButton('manualPan','hand','Déplacer','Déplacer le plan · H ou Espace + glisser','hand'),
    manualButton('manualFit','scan','Cadrer','Afficher toute la feuille · 0'),
    manualButton('manualZoomIn','zoom-in','Zoom +','Zoomer sur le plan · +'),
    manualButton('manualZoomOut','zoom-out','Zoom −','Dézoomer sur le plan · −')
  ].join('');
  const measure=[
    manualButton('manualScale','ruler','Échelle','Calibrer avec une cote connue · C','calibrate','manual-line'),
    manualButton('manualDimension','move-horizontal','Cote','Mesurer une cote de référence, sans commande · D','dimension','manual-line')
  ].join('');
  const takeoff=[
    manualButton('manualArea','pentagon','Surface','Tracer une surface polygonale · S','area','manual-area'),
    manualButton('manualRectangle','square','Rectangle','Mesurer un rectangle en deux coins · P','rectangle','manual-area'),
    manualButton('manualLinear','ruler','Ligne','Mesurer une ligne ou une plinthe · L','linear','manual-line'),
    manualButton('manualSegment','waypoints','Segments','Mesurer des segments indépendants · J','segment','manual-segment'),
    manualButton('manualCount','list-ordered','Comptage','Compter des éléments par clic, sans échelle · Q','count','manual-count')
  ].join('');
  const correction=[
    manualButton('manualExclude','square-minus','Exclure','Retrancher une zone dans la surface sélectionnée · X','exclude','manual-segment'),
    manualButton('manualUndo','undo-2','Annuler','Annuler la dernière modification · Ctrl+Z'),
    manualButton('manualRedo','redo-2','Rétablir','Rétablir la modification · Ctrl+Y')
  ].join('');
  const workflow=$('#workflow'),legacy=$('.ribbon');
  workflow.insertAdjacentHTML('beforebegin',`<section id="manualRibbon" class="manual-ribbon" aria-label="Ruban de relevé"><div class="manual-ribbon-scroll" role="toolbar" aria-label="Projet, détection et mesures"><div class="manual-group" role="group" aria-label="Projet"><div id="ribbonProject" class="manual-group-buttons"></div><span class="manual-group-label">Projet</span></div><div class="manual-group" role="group" aria-label="Navigation"><div class="manual-group-buttons">${navigation}</div><span class="manual-group-label">Navigation</span></div><div class="manual-group" role="group" aria-label="Mesurer"><div class="manual-group-buttons">${measure}</div><span class="manual-group-label">Mesurer</span></div><div class="manual-group" role="group" aria-label="Relevé manuel"><div class="manual-group-buttons">${takeoff}</div><span class="manual-group-label">Relevé manuel</span></div><div class="manual-group" role="group" aria-label="Détection des surfaces"><div id="ribbonDetection" class="manual-group-buttons"></div><span class="manual-group-label">Détection</span></div><div class="manual-group" role="group" aria-label="Corriger"><div id="ribbonCorrection" class="manual-group-buttons">${correction}</div><span class="manual-group-label">Corriger</span></div><div class="manual-group" role="group" aria-label="Calepinage"><div id="ribbonLayout" class="manual-group-buttons"></div><span class="manual-group-label">Calepinage</span></div><div class="manual-group" role="group" aria-label="Commandes et aide"><div id="ribbonManagement" class="manual-group-buttons"></div><span class="manual-group-label">Commandes et aide</span></div></div><div class="manual-status-line"><p id="manualStatus" role="status" aria-live="polite">Ouvrez un plan pour commencer le relevé.</p><div id="manualActions" class="manual-actions" hidden><button type="button" id="manualFinish">Terminer · Entrée</button><button type="button" id="manualCancel">Annuler le tracé · Échap</button></div></div></section>`);
  const moveButton=(selector,host,icon,label,title)=>{
    const button=$(selector);if(!button)return;
    button.type='button';button.className='manual-button';
    if(icon)button.innerHTML=`<i data-lucide="${icon}" aria-hidden="true"></i><span>${label}</span>${button.id==='stepReview'?'<b id="reviewCount">0</b>':''}`;
    if(title){button.title=title;button.setAttribute('aria-label',title);}
    host.append(button);
  };
  const project=$('#ribbonProject');
  moveButton('#stepOpen',project,'folder-open','Ouvrir','Ouvrir un plan PDF ou une image');
  moveButton('#stepDetect',project,'scan-line','Détecter','Détecter les surfaces de la feuille · Ctrl+Maj+A');
  moveButton('#stepReview',project,'list-checks','Réviser','Réviser les surfaces et les quantités');
  moveButton('#saveProjectBtn',project,'save','Sauver','Sauvegarder le relevé · Ctrl+S');
  const detection=$('#ribbonDetection'),corrections=$('#ribbonCorrection'),layout=$('#ribbonLayout'),management=$('#ribbonManagement');
  moveButton('[data-tool="auto"]',detection,'wand-sparkles','Au clic','Détecter la pièce au clic · A');
  moveButton('[data-tool="divider"]',detection,'door-closed','Passage','Fermer un passage pour séparer les surfaces · B');
  moveButton('[data-tool="region"]',detection,'scan','Cadre','Limiter la détection à un cadre · R');
  detection.insertAdjacentHTML('beforeend',manualButton('wallLayersToggle','brick-wall','Murs','Afficher les murs extérieurs, intérieurs et de corridor proposés'));
  $('#wallLayersToggle').onclick=toggleWallInspection;
  moveButton('[data-tool="edit"]',corrections,'square-pen','Sommets','Modifier les sommets de la surface sélectionnée · E');
  moveButton('[data-tool="split"]',corrections,'scissors','Découpe','Découper une surface par une ligne · F');
  moveButton('#deleteSelection',corrections,'trash-2','Supprimer','Supprimer les mesures sélectionnées · Suppr');
  moveButton('#tileSettings',layout,'grid-3x3','Carreaux','Régler le format et la pose des carreaux');
  moveButton('#tileOriginBtn',layout,'locate-fixed','Origine','Choisir le point de départ de la céramique · T');
  moveButton('#toggleTileGrid',layout,'layout-grid','Trame','Afficher ou masquer la trame des carreaux · G');
  moveButton('#ordersBtn',management,'package-check','Commandes','Estimation et commandes · F4');
  moveButton('#catalogNav',management,'library','Assemblages','Configurer les finis et assemblages');
  moveButton('#demoBtn',management,'file-text','Exemple','Ouvrir le plan fictif de démonstration');
  moveButton('#helpBtn',management,'keyboard','Aide','Afficher l’aide souris et raccourcis · ?');
  detection.insertAdjacentHTML('beforeend',manualButton('wallTakeoffBtn','panel-top','Mural','Proposer les dosserets et la céramique murale'));
  detection.insertAdjacentHTML('beforeend',manualButton('traceWallBtn','panel-left','Tracer mur','Tracer un parcours mural avec sa hauteur'));
  $('#wallTakeoffBtn').onclick=()=>openWallTakeoffDialog();
  $('#traceWallBtn').onclick=()=>startWallTakeoffTrace();
  for(const id of ['fileInput','projectInput'])if($('#'+id))$('.app').append($('#'+id));
  workflow.remove();legacy?.remove();$('.topbar .menu')?.remove();
  for(const id of ['zoomIn','zoomOut','fitView'])$('#'+id)?.remove();
  $$('[data-manual-tool]',$('#manualRibbon')).forEach(button=>button.onclick=()=>startManualTool(button.dataset.manualTool));
  $('#manualFit').onclick=()=>{fitPlan();refresh();};
  $('#manualZoomIn').onclick=()=>zoomAt(S.zoom*1.2);
  $('#manualZoomOut').onclick=()=>zoomAt(S.zoom/1.2);
  $('#manualUndo').onclick=undoChange;$('#manualRedo').onclick=redoChange;
  $('#manualFinish').onclick=()=>{finishManualTool();if(!$('#overlay').querySelector('[role="dialog"]'))canvas.focus();};
  $('#manualCancel').onclick=()=>{S.draft=[];S.tool='select';refresh();canvas.focus();};
  lucide.createIcons({attrs:{width:18,height:18,'stroke-width':1.8}});
  initRibbonOverflow();
  refreshManualUI();
}
let ribbonOverflowState=null;
function closeAdvancedTools(restoreFocus=false) {
  const panel=$('#advancedTools'),button=$('#advancedToggle');if(!panel||panel.hidden)return;
  panel.hidden=true;button.setAttribute('aria-expanded','false');
  if(restoreFocus&&!button.hidden)button.focus({preventScroll:true});
}
function initRibbonOverflow() {
  const ribbon=$('#manualRibbon'),strip=$('.manual-ribbon-scroll',ribbon),main=document.createElement('div');
  main.className='manual-ribbon-main';strip.before(main);main.append(strip);
  main.insertAdjacentHTML('beforeend',`<div id="manualOverflowHolder" class="manual-overflow-holder" hidden>${manualButton('advancedToggle','ellipsis','Plus','Afficher les outils qui dépassent la largeur du ruban')}<span class="manual-group-label">Autres outils</span></div>`);
  main.insertAdjacentHTML('afterend','<section id="advancedTools" class="advanced-tools" aria-label="Outils supplémentaires du ruban" hidden><header><strong>Autres outils</strong><button type="button" id="closeAdvanced" aria-label="Fermer les autres outils">×</button></header><div id="ribbonOverflowGroups"></div></section>');
  const panel=$('#advancedTools'),toggle=$('#advancedToggle'),holder=$('#manualOverflowHolder'),groups=$$('.manual-group',strip),entries=[];
  const lowPriority=['demoBtn','helpBtn','catalogNav','ordersBtn','tileOriginBtn','toggleTileGrid','tileSettings','manualZoomOut','manualZoomIn','manualDimension','manualSegment','manualRectangle','wallLayersToggle','manualPan','manualFit'];
  const middlePriority=['manualCount','manualLinear','manualExclude','manualRedo','manualUndo','wallTakeoffBtn','traceWallBtn'];
  groups.forEach((group,index)=>{
    const home=$('.manual-group-buttons',group),overflow=document.createElement('div');overflow.className='ribbon-overflow-group';overflow.hidden=true;
    const label=group.getAttribute('aria-label')||$('.manual-group-label',group).textContent;
    const heading=document.createElement('h3');heading.textContent=label;overflow.append(heading);
    const buttons=document.createElement('div');buttons.className='ribbon-overflow-buttons';overflow.append(buttons);$('#ribbonOverflowGroups').append(overflow);
    [...home.children].forEach((button,position)=>{
      const tool=button.dataset.tool,priority=lowPriority.includes(button.id)?lowPriority.indexOf(button.id):['auto','region','divider','edit'].includes(tool)?15+['auto','region','divider','edit'].indexOf(tool):middlePriority.includes(button.id)?25+middlePriority.indexOf(button.id):button.id==='deleteSelection'||tool==='split'?50:button.id==='manualScale'?70:button.id==='manualSelect'?80:90+index;
      entries.push({button,home,group,overflow,buttons,position,priority});
    });
  });
  ribbonOverflowState={ribbon,strip,main,panel,toggle,holder,groups,entries,order:[...entries].sort((a,b)=>a.priority-b.priority),scheduled:false,width:0};
  toggle.setAttribute('aria-controls','advancedTools');toggle.setAttribute('aria-expanded','false');
  toggle.onclick=()=>{if(!panel.hidden)return closeAdvancedTools(true);panel.hidden=false;toggle.setAttribute('aria-expanded','true');(panel.querySelector('.manual-button:not(:disabled)')||$('#closeAdvanced')).focus({preventScroll:true});};
  $('#closeAdvanced').onclick=()=>closeAdvancedTools(true);
  panel.addEventListener('click',event=>{
    const button=event.target.closest('.manual-button');if(!button)return;
    const dialog=$('#overlay')?.querySelector('[role="dialog"]');
    if(dialog&&panel.contains(S.dialogReturnFocus))S.dialogReturnFocus=toggle;
    closeAdvancedTools(false);
    if(!dialog)canvas.focus({preventScroll:true});
  });
  document.addEventListener('pointerdown',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!toggle.contains(event.target))closeAdvancedTools(false);});
  document.addEventListener('keydown',event=>{if(!panel.hidden&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeAdvancedTools(true);}},true);
  const schedule=()=>{
    const state=ribbonOverflowState;if(!state||state.scheduled)return;state.scheduled=true;
    requestAnimationFrame(()=>{state.scheduled=false;layoutRibbonOverflow();});
  };
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(Math.abs(width-ribbonOverflowState.width)>.5)schedule();}).observe(main);
  window.addEventListener('resize',schedule);lucide.createIcons();schedule();
}
function layoutRibbonOverflow() {
  const state=ribbonOverflowState;if(!state)return;
  const {strip,main,panel,toggle,holder,groups,entries,order}=state,focused=document.activeElement,wasOpen=!panel.hidden;
  for(const entry of entries){entry.home.append(entry.button);entry.overflow.hidden=true;}
  groups.forEach(group=>group.hidden=false);holder.hidden=true;
  if(strip.scrollWidth>strip.clientWidth+1){
    holder.hidden=false;
    for(const entry of order){
      if(strip.scrollWidth<=strip.clientWidth+1)break;
      entry.buttons.append(entry.button);entry.overflow.hidden=false;
      if(!entry.home.children.length)entry.group.hidden=true;
    }
  }
  const hasOverflow=!holder.hidden;
  toggle.hidden=!hasOverflow;panel.hidden=!hasOverflow||!wasOpen;toggle.setAttribute('aria-expanded',String(!panel.hidden));
  panel.style.top=main.offsetHeight+'px';state.width=main.getBoundingClientRect().width;
  if(hasOverflow&&panel.hidden&&panel.contains(S.dialogReturnFocus)&&$('#overlay')?.querySelector('[role="dialog"]'))S.dialogReturnFocus=toggle;
  if(focused&&focused!==document.body&&state.ribbon.contains(focused)){
    if(panel.hidden&&panel.contains(focused)){if(hasOverflow)toggle.focus({preventScroll:true});}
    else if(focused===toggle&&!hasOverflow)$('#stepOpen').focus({preventScroll:true});
    else focused.focus({preventScroll:true});
  }
  refreshRibbonOverflowState();
}
function refreshRibbonOverflowState() {
  const state=ribbonOverflowState;if(!state)return;
  const active=!!state.panel.querySelector('.manual-button[aria-pressed="true"],.manual-button.selection-ready');
  state.toggle.classList.toggle('contains-active-tool',active);
}
function manualStatusText() {
  if(!S.plan)return 'Ouvrez un plan pour commencer le relevé manuel.';
  if(S.loading||S.detectJob)return 'Chargement ou analyse en cours…';
  const n=S.draft.length,scale=S.scale,point=S.mouseWorld;
  if(S.tool==='count')return `${n} élément${n>1?'s':''} pointé${n>1?'s':''} · Cliquez chaque élément, puis Terminer ou Entrée. Aucune échelle requise.`;
  if(S.tool==='rectangle') {
    const quantity=n&&point&&scale?Math.abs((point.x-S.draft[0].x)*(point.y-S.draft[0].y))*scale*scale:null;
    return n?`Rectangle : choisissez le coin opposé${quantity!==null?' · aperçu '+fmt(quantity)+' pi²':''}.`:'Rectangle : cliquez le premier coin, puis le coin opposé.';
  }
  if(S.tool==='dimension'||S.tool==='segment') {
    const quantity=n&&point&&scale?dist(S.draft[0],point)*scale:null;
    const name=S.tool==='dimension'?'Cote de référence':'Segment';
    if(!n)return name+' : cliquez les deux extrémités'+(S.tool==='dimension'?' · exclue des commandes.':' · chaque paire crée une ligne indépendante.');
    return name+' : cliquez l’autre extrémité'+(quantity!==null?' · aperçu '+fmt(quantity)+' pi':'')+'.';
  }
  if(S.tool==='split')return n?'Découpe : cliquez l’autre extrémité de la ligne traversant la surface.':'Découpe : cliquez deux extrémités d’une ligne traversant la surface sélectionnée.';
  if(['area','exclude'].includes(S.tool))return `${S.tool==='exclude'?'Exclusion':'Surface'} : ${n} point${n>1?'s':''}${n>=3&&scale?' · '+fmt(area(S.draft)*scale*scale)+' pi²':''} · Cliquez les coins, puis Terminer ou Entrée.`;
  if(S.tool==='wallTrace')return `Parcours mural : ${n} point${n>1?'s':''}${n>=2&&scale?' · '+fmt(lineLength(S.draft)*scale)+' pi':''} · Cliquez les pans, puis Terminer pour vérifier la hauteur.`;
  if(S.tool==='linear')return `Ligne : ${n} point${n>1?'s':''}${n>=2&&scale?' · '+fmt(lineLength(S.draft)*scale)+' pi':''} · Cliquez les points, puis Terminer ou Entrée.`;
  if(S.tool==='calibrate')return 'Échelle : cliquez les extrémités d’une cote connue, puis saisissez sa longueur.';
  if(S.tool==='hand')return 'Déplacer : glissez le plan · molette pour zoomer · V pour sélectionner.';
  if(S.tool==='auto')return 'Pièce au clic : cliquez à l’intérieur d’une pièce fermée.';
  if(S.tool==='divider')return 'Fermer un passage : cliquez ses deux extrémités, puis relancez Détecter.';
  if(S.tool==='region')return 'Cadre de détection : cliquez deux coins opposés autour des pièces à analyser.';
  if(S.tool==='edit')return 'Modifier les coins : glissez un sommet de la surface sélectionnée.';
  if(S.tool==='tileOrigin')return 'Point de départ : cliquez l’origine de pose de la céramique sélectionnée.';
  if(S.tool==='fixtureBox')return 'Bain ou douche : cliquez les deux coins opposés de l’emprise à retrancher · Échap pour annuler.';
  if(S.tool==='fixturePolygon')return 'Bain ou douche : cliquez les coins de l’emprise, puis Entrée pour la retrancher.';
  if(S.tool==='fixtureEdit')return 'Emprise du bain ou de la douche : glissez les coins orange pour la corriger.';
  return 'Détecter propose les pièces · Cliquez une surface pour afficher ses sommets et les déplacer.';
}
function refreshManualUI() {
  const ribbon=$('#manualRibbon');if(!ribbon)return;
  const busy=!S.plan||S.loading||!!S.detectJob,
    measuredArea=S.selection.size===1&&S.items.find(item=>S.selection.has(item.id)&&item.page===S.page&&item.kind==='area'),
    surface=typeof actionableSurface==='function'?actionableSurface():measuredArea?{item:measuredArea,preview:false}:null;
  $$('[data-manual-tool]',ribbon).forEach(button=>{
    const tool=button.dataset.manualTool,selected=S.tool===tool;
    button.setAttribute('aria-pressed',String(selected));
    button.classList.toggle('active',selected);
    button.disabled=busy||(tool==='exclude'&&!surface);
    if(busy)button.title=!S.plan?'Ouvrez un plan pour utiliser '+button.textContent.trim().toLowerCase()+'.':'Attendez la fin du chargement ou de l’analyse.';
    else if(tool==='exclude'&&button.disabled)button.title='Sélectionnez d’abord une surface à laquelle retrancher une zone.';
    else button.title=button.getAttribute('aria-label');
  });
  for(const id of ['manualFit','manualZoomIn','manualZoomOut'])$('#'+id).disabled=busy;
  $('#manualUndo').disabled=busy||!S.history.length;$('#manualRedo').disabled=busy||!S.redo.length;
  $$('[data-tool]',ribbon).forEach(button=>{
    const requiresArea=['edit','split'].includes(button.dataset.tool);
    button.disabled=busy||requiresArea&&!surface;
    button.setAttribute('aria-pressed',String(S.tool===button.dataset.tool));
    button.title=busy?(!S.plan?'Ouvrez un plan pour utiliser cet outil.':'Attendez la fin du chargement ou de l’analyse.'):requiresArea&&!surface?'Sélectionnez une surface mesurée ou une proposition détectée à modifier.':button.getAttribute('aria-label');
  });
  const canDelete=!busy&&(typeof hasDeletableSelection==='function'?hasDeletableSelection():S.selection.size>0);
  $('#deleteSelection').disabled=!canDelete;$('#deleteSelection').setAttribute('aria-disabled',String(!canDelete));$('#deleteSelection').classList.toggle('selection-ready',canDelete);
  $('#deleteSelection').title=busy?(!S.plan?'Ouvrez un plan avant de supprimer une mesure.':'Attendez la fin du chargement ou de l’analyse.'):!canDelete?'Sélectionnez une mesure ou une proposition à supprimer.':$('#deleteSelection').getAttribute('aria-label');
  $('#tileSettings').disabled=busy||!measuredArea;
  $('#tileOriginBtn').disabled=busy||!measuredArea||!measuredArea.material.startsWith('CER');
  $('#toggleTileGrid').disabled=busy;
  $('#wallLayersToggle').disabled=busy||!S.scale;
  $('#wallLayersToggle').setAttribute('aria-pressed',String(!!S.settings.showWalls));
  $('#wallLayersToggle').title=busy?(!S.plan?'Ouvrez un plan pour examiner les murs.':'Attendez la fin du chargement ou de l’analyse.'):!S.scale?'Calibrez le plan avant d’examiner les murs.':$('#wallLayersToggle').getAttribute('aria-label');
  for(const id of ['tileSettings','tileOriginBtn'])$('#'+id).title=busy?(!S.plan?'Ouvrez un plan pour régler le calepinage.':'Attendez la fin du chargement ou de l’analyse.'):!measuredArea?'Sélectionnez une surface ajoutée au relevé pour régler le calepinage.':id==='tileOriginBtn'&&!measuredArea.material.startsWith('CER')?'Sélectionnez une surface de céramique pour placer le départ.':$('#'+id).getAttribute('aria-label');
  for(const id of ['wallTakeoffBtn','traceWallBtn']){$('#'+id).disabled=busy||!S.scale;$('#'+id).title=busy?(!S.plan?'Ouvrez un plan pour relever la céramique murale.':'Attendez la fin du chargement ou de l’analyse.'):!S.scale?'Calibrez le plan avant de calculer les surfaces murales.':$('#'+id).getAttribute('aria-label');}
  const finishable=['area','linear','split','exclude','rectangle','segment','count','dimension','wallTrace'].includes(S.tool);
  $('#manualActions').hidden=!finishable;
  const n=S.draft.length;
  $('#manualFinish').disabled=busy||(['area','exclude'].includes(S.tool)?n<3:S.tool==='count'?n<1:S.tool==='segment'?n===1:n<2);
  $('#manualCancel').disabled=busy;
  const text=manualStatusText();if($('#manualStatus').textContent!==text)$('#manualStatus').textContent=text;
  refreshRibbonOverflowState();
}
function handleManualClick(point,event) {
  if(!['rectangle','segment','count','dimension'].includes(S.tool))return false;
  if(event?.detail>1)return true;
  if(S.tool!=='count'&&!S.scale){toast('Calibrez le plan avant de mesurer une longueur ou une surface.');return true;}
  if(S.draft.length&&dist(S.draft.at(-1),point)<=.5)return true;
  S.draft.push({...point});
  if(S.tool==='count'){refreshManualUI();return true;}
  if(S.draft.length===2)finishManualTool();
  else refreshManualUI();
  return true;
}
function addManualLine(points,dimension=false) {
  if(!S.scale)return toast('Calibrez le plan avant de mesurer cette ligne.');
  if(points.length!==2||dist(points[0],points[1])<=.5)return toast('Choisissez deux extrémités distinctes.');
  const method=dimension?'Cote manuelle':'Segment manuel';
  const number=S.items.filter(item=>item.method===method).length+1;
  const item={id:uid(),kind:'linear',name:(dimension?'Cote ':'Segment ')+number,material:'PL-01',points:structuredClone(points),qty:dist(points[0],points[1])*S.scale,waste:dimension?0:5,page:S.page,status:'à valider',method};
  if(dimension)item.measureOnly=true;
  pushItems([...S.items,item]);setSelection([item.id]);S.draft=[];S.tool=dimension?'select':'segment';refresh();
  toast(dimension?'Cote de référence ajoutée · exclue des commandes.':'Segment ajouté · cliquez deux points pour le suivant.');
}
function finishManualTool() {
  const tool=S.tool;
  if(tool==='wallTrace'){finishWallTakeoffTrace(S.draft);return true;}
  if(tool==='split'){finishSurfaceSplit();return true;}
  if(!['rectangle','segment','count','dimension','area','linear','split','exclude'].includes(tool))return false;
  if(tool==='count') {
    if(!S.draft.length){toast('Cliquez au moins un élément avant de terminer le comptage.');return true;}
    const item={id:uid(),kind:'count',name:'Comptage '+(S.items.filter(entry=>entry.kind==='count').length+1),material:'QT-01',points:structuredClone(S.draft),qty:S.draft.length,waste:0,page:S.page,status:'à valider',method:'Comptage manuel'};
    pushItems([...S.items,item]);setSelection([item.id]);S.draft=[];S.tool='select';refresh();toast(item.qty+' élément(s) ajouté(s) au relevé.');
  } else if(tool==='rectangle') {
    if(S.draft.length!==2){toast('Cliquez deux coins opposés pour mesurer le rectangle.');return true;}
    const b=boundsOf(S.draft);
    if(b.right-b.x<=.5||b.bottom-b.y<=.5){S.draft=S.draft.slice(0,1);refreshManualUI();toast('Choisissez un coin opposé formant un rectangle non nul.');return true;}
    finishArea([{x:b.x,y:b.y},{x:b.right,y:b.y},{x:b.right,y:b.bottom},{x:b.x,y:b.bottom}],'Rectangle manuel');
  } else if(tool==='segment'||tool==='dimension') {
    if(tool==='segment'&&!S.draft.length){S.tool='select';refresh();return true;}
    if(S.draft.length!==2){toast('Cliquez les deux extrémités avant de terminer.');return true;}
    addManualLine(S.draft,tool==='dimension');
  } else if(tool==='linear') {
    if(S.draft.length<2){toast('Cliquez au moins deux points pour mesurer une ligne.');return true;}
    finishLine(S.draft);
  } else {
    if(S.draft.length<3){toast('Cliquez au moins trois coins avant de terminer la surface.');return true;}
    finishArea(S.draft);
  }
  return true;
}
function drawManualPoint(context,point,label,color,active=false) {
  const radius=(active?8:7)/S.zoom;
  context.beginPath();context.arc(point.x,point.y,radius,0,Math.PI*2);context.fillStyle=color;context.fill();
  context.lineWidth=(active?2.5:1.5)/S.zoom;context.strokeStyle='#ffffff';context.stroke();
  context.fillStyle='#ffffff';context.font=`700 ${10/S.zoom}px Arial`;context.textAlign='center';context.textBaseline='middle';context.fillText(String(label),point.x,point.y+.25/S.zoom);
}
function drawCountItem(context,item,active) {
  context.save();
  item.points.forEach((point,index)=>drawManualPoint(context,point,index+1,colorForItem(item),active));
  if(item.points.length){const first=item.points[0];context.font=`600 ${12/S.zoom}px Arial`;context.textAlign='left';context.textBaseline='alphabetic';context.lineWidth=3/S.zoom;context.strokeStyle='#ffffff';const label=item.name+' · '+fmt(item.qty,0)+' u';context.strokeText(label,first.x+12/S.zoom,first.y-12/S.zoom);context.fillStyle=colorForItem(item);context.fillText(label,first.x+12/S.zoom,first.y-12/S.zoom);}
  context.restore();
}
function drawManualLineDecorations(context,item) {
  if(!item.measureOnly||item.points.length<2)return;
  const a=item.points[0],b=item.points.at(-1),length=dist(a,b);if(!length)return;
  const nx=-(b.y-a.y)/length,ny=(b.x-a.x)/length,tick=6/S.zoom;
  context.save();context.strokeStyle=colorForItem(item);context.lineWidth=1.5/S.zoom;
  for(const point of [a,b]){context.beginPath();context.moveTo(point.x-nx*tick,point.y-ny*tick);context.lineTo(point.x+nx*tick,point.y+ny*tick);context.stroke();}
  const x=(a.x+b.x)/2+nx*12/S.zoom,y=(a.y+b.y)/2+ny*12/S.zoom,label=fmt(item.qty,2)+' pi';
  context.font=`700 ${12/S.zoom}px Arial`;context.textAlign='center';context.textBaseline='middle';context.lineWidth=4/S.zoom;context.strokeStyle='#ffffff';context.strokeText(label,x,y);context.fillStyle=colorForItem(item);context.fillText(label,x,y);context.restore();
}
function drawManualGuides(context) {
  if(!S.draft.length)return;
  context.save();
  if(S.tool==='count')S.draft.forEach((point,index)=>drawManualPoint(context,point,index+1,'#6846a3'));
  else if(['rectangle','segment','dimension'].includes(S.tool)) {
    const first=S.draft[0],last=S.mouseWorld||first,color=S.tool==='rectangle'?'#256d54':'#25649a';
    context.strokeStyle=color;context.fillStyle=color+'18';context.lineWidth=1.5/S.zoom;context.setLineDash([6/S.zoom,4/S.zoom]);
    context.beginPath();
    if(S.tool==='rectangle'){const b=boundsOf([first,last]);context.rect(b.x,b.y,b.right-b.x,b.bottom-b.y);context.fill();context.stroke();}
    else{context.moveTo(first.x,first.y);context.lineTo(last.x,last.y);context.stroke();}
    context.setLineDash([]);drawManualPoint(context,first,'1',color);
  }
  context.restore();
  // Drawing reads the current pointer even when no takeoff state is committed.
  if(['rectangle','segment','dimension'].includes(S.tool)){
    const status=$('#manualStatus'),text=manualStatusText();if(status&&status.textContent!==text)status.textContent=text;
  }
}

/* Flat project folders organize measurements without changing their quantities. */
function selectedFolderItems() {
  return S.items.filter(item=>item.page===S.page&&S.selection.has(item.id));
}
function folderNameKey(name) {
  return name.trim().normalize('NFKC').toLocaleLowerCase('fr-CA');
}
function folderNameError(name,exceptId=null) {
  if(!name.trim())return 'Saisissez le nom du dossier.';
  if(name.length>80||/[\u0000-\u001f\u007f]/.test(name))return 'Utilisez un nom de 1 à 80 caractères, sur une seule ligne.';
  if(S.folders.some(folder=>folder.id!==exceptId&&folderNameKey(folder.name)===folderNameKey(name)))return 'Ce nom existe déjà. Choisissez un autre nom de dossier.';
  return '';
}
function validateFolders(data) {
  if(data.folders!==undefined&&(!Array.isArray(data.folders)||data.folders.length>200))throw new Error('La liste des dossiers est invalide.');
  const ids=new Set(),names=new Set();
  for(const folder of data.folders||[]) {
    if(!folder||typeof folder!=='object'||typeof folder.id!=='string'||!/^[a-z0-9_-]{1,60}$/i.test(folder.id)||ids.has(folder.id)||
      typeof folder.name!=='string'||!folder.name.trim()||folder.name.length>80||/[\u0000-\u001f\u007f]/.test(folder.name)||
      folder.collapsed!==undefined&&typeof folder.collapsed!=='boolean')throw new Error('Le relevé contient un dossier invalide.');
    const name=folderNameKey(folder.name);if(names.has(name))throw new Error('Deux dossiers portent le même nom.');
    ids.add(folder.id);names.add(name);
  }
  for(const item of data.items||[])if(item.folderId!==undefined&&(typeof item.folderId!=='string'||!ids.has(item.folderId)))throw new Error('Une mesure fait référence à un dossier absent.');
  return data;
}
function folderBusy() {return !S.plan||S.loading||!!S.detectJob;}
function finishFolderMutation(message,focusId=null) {
  closeDialog();save();refresh();
  if(focusId)$('#'+focusId)?.focus();
  toast(message);
}
function folderDialog(id=null,assignSelection=false) {
  if(folderBusy())return toast(!S.plan?'Ouvrez un plan avant de créer un dossier.':'Attendez la fin du chargement ou de l’analyse.');
  if(!id&&S.folders.length>=200)return toast('Le projet contient déjà 200 dossiers.');
  const folder=id?S.folders.find(entry=>entry.id===id):null;if(id&&!folder)return;
  const selected=selectedFolderItems();
  openDialog(folder?'Renommer le dossier':'Créer un dossier de mesures',`<form id="folderForm"><label for="folderName">Nom du dossier</label><input id="folderName" name="folderName" maxlength="80" value="${esc(folder?.name||'')}" placeholder="Ex. Vinyle · étage 2" autocomplete="off" required>${!folder&&selected.length?`<label class="folder-dialog-check"><input id="folderAssignSelection" type="checkbox" ${assignSelection?'checked':''}> Y classer les ${selected.length} mesure(s) sélectionnée(s)</label>`:''}<p id="folderError" class="v4-error" role="alert"></p><div class="modal-actions"><button type="button" id="cancelFolder">Annuler</button><button type="submit" class="primary" id="saveFolder">${folder?'Enregistrer le nom':'Créer le dossier'}</button></div></form>`);
  $('#folderName').focus();$('#folderName').select();
  $('#cancelFolder').onclick=closeDialog;
  $('#folderForm').onsubmit=event=>{
    event.preventDefault();const name=$('#folderName').value.trim(),error=folderNameError(name,id);
    if(error){$('#folderError').textContent=error;$('#folderName').focus();return;}
    remember();
    if(folder)folder.name=name;
    else {
      const created={id:uid(),name,collapsed:false};S.folders.push(created);
      if($('#folderAssignSelection')?.checked)for(const item of selected)item.folderId=created.id;
    }
    finishFolderMutation(folder?'Dossier renommé.':'Dossier créé.','newMeasureFolder');
  };
}
function deleteFolderDialog(id) {
  if(folderBusy())return;
  const folder=S.folders.find(entry=>entry.id===id);if(!folder)return;
  const count=S.items.filter(item=>item.folderId===id).length;
  openDialog('Supprimer le dossier',`<p>Supprimer le dossier <b>${esc(folder.name)}</b> ?</p><p>Ses ${count} mesure(s) seront conservées dans <b>Non classées</b>, sur leurs feuilles d’origine. Aucune surface ou quantité ne sera supprimée.</p><div class="modal-actions"><button type="button" id="cancelDeleteFolder">Annuler</button><button type="button" class="folder-delete-confirm" id="deleteFolder">Supprimer le dossier</button></div>`);
  $('#cancelDeleteFolder').onclick=closeDialog;
  $('#deleteFolder').onclick=()=>{
    remember();S.folders=S.folders.filter(entry=>entry.id!==id);
    for(const item of S.items)if(item.folderId===id)delete item.folderId;
    finishFolderMutation('Dossier supprimé ; mesures conservées dans Non classées.','newMeasureFolder');
  };
}
function assignMeasuresToFolder(items,folderId) {
  if(folderId&&!S.folders.some(folder=>folder.id===folderId))return false;
  const changed=items.filter(item=>(item.folderId||'')!==folderId);if(!changed.length)return false;
  remember();
  for(const item of changed)if(folderId)item.folderId=folderId;else delete item.folderId;
  const folder=S.folders.find(entry=>entry.id===folderId);if(folder)folder.collapsed=false;
  save();refresh();toast(`${changed.length} mesure(s) classée(s) dans ${folder?.name||'Non classées'}.`);return true;
}
function folderOptions(selected='') {
  return `<option value="">Non classées</option>${S.folders.map(folder=>`<option value="${folder.id}" ${folder.id===selected?'selected':''}>${esc(folder.name)}</option>`).join('')}`;
}
function assignFolderDialog() {
  const items=selectedFolderItems();if(!items.length)return toast('Sélectionnez les mesures à classer dans la liste ou sur le plan.');
  if(folderBusy())return;
  const values=new Set(items.map(item=>item.folderId||'')),value=values.size===1?[...values][0]:'';
  openDialog('Classer les mesures',`<form id="assignFolderForm"><p>${items.length} mesure(s) sélectionnée(s) sur la feuille active. Le classement conserve leurs surfaces, unités et statuts.</p><label for="assignFolderDialogSelect">Dossier</label><select id="assignFolderDialogSelect">${folderOptions(value)}</select><div class="modal-actions"><button type="button" id="cancelAssignFolder">Annuler</button><button type="submit" class="primary" id="saveFolderAssignment">Classer les mesures</button></div></form>`);
  $('#cancelAssignFolder').onclick=closeDialog;
  $('#assignFolderForm').onsubmit=event=>{
    event.preventDefault();const folderId=$('#assignFolderDialogSelect').value;
    closeDialog();assignMeasuresToFolder(items,folderId);$('#assignMeasureFolder')?.focus();
  };
}
function initFoldersUI() {
  if(!Array.isArray(S.folders))S.folders=[];
  if($('#measureFolderTools'))return;
  $('#measureTree').insertAdjacentHTML('beforebegin',`<div id="measureFolderTools" class="measure-folder-tools" aria-label="Organisation des mesures"><button type="button" id="newMeasureFolder" title="Créer un dossier de mesures"><i data-lucide="folder-plus" aria-hidden="true"></i><span>Dossier +</span></button><button type="button" id="assignMeasureFolder" title="Classer les mesures sélectionnées"><i data-lucide="folder-input" aria-hidden="true"></i><span>Classer</span></button></div>`);
  $('#newMeasureFolder').onclick=()=>folderDialog(null,selectedFolderItems().length>0);
  $('#assignMeasureFolder').onclick=assignFolderDialog;
  lucide.createIcons();
}
function folderMeasureRow(item) {
  return `<div class="measure-row ${S.selection.has(item.id)?'active':''}" data-item="${item.id}" tabindex="0" role="button" aria-pressed="${S.selection.has(item.id)}"><i style="background:${colorForItem(item)}"></i><span><b>${esc(item.name)}</b><small>${esc(displayCodeForItem(item))} · ${esc(item.status)}</small></span><strong>${itemQuantityText(item)}</strong></div>`;
}
function renderMeasureTree(visibleItems) {
  if(!Array.isArray(S.folders))S.folders=[];
  const tree=$('#measureTree'),busy=folderBusy(),folderIds=new Set(S.folders.map(folder=>folder.id));
  const unclassified=item=>!folderIds.has(item.folderId),unfiled=visibleItems.filter(unclassified),allUnfiled=S.items.filter(unclassified).length;
  const groups=S.folders.map(folder=>{
    const items=visibleItems.filter(item=>item.folderId===folder.id),all=S.items.filter(item=>item.folderId===folder.id).length,
      hint=`${items.length} mesure(s) sur cette feuille ; ${all} dans le projet`,expanded=!folder.collapsed;
    return `<section class="measure-folder" data-measure-folder="${folder.id}"><div class="measure-folder-heading"><button type="button" class="measure-folder-toggle" data-folder-toggle="${folder.id}" aria-expanded="${expanded}" aria-controls="folderContents-${folder.id}" title="${esc(folder.name)} · ${hint}"><i data-lucide="${expanded?'folder-open':'folder'}" aria-hidden="true"></i><span>${esc(folder.name)}</span><small aria-label="${hint}">${items.length}/${all}</small></button><button type="button" class="measure-folder-action" data-folder-rename="${folder.id}" aria-label="Renommer le dossier ${esc(folder.name)}" title="Renommer le dossier" ${busy?'disabled':''}><i data-lucide="pencil" aria-hidden="true"></i></button><button type="button" class="measure-folder-action" data-folder-delete="${folder.id}" aria-label="Supprimer le dossier ${esc(folder.name)} en conservant ses mesures" title="Supprimer le dossier, conserver les mesures" ${busy?'disabled':''}><i data-lucide="trash-2" aria-hidden="true"></i></button></div><div id="folderContents-${folder.id}" class="measure-folder-contents" ${expanded?'':'hidden'}>${items.length?items.map(folderMeasureRow).join(''):'<p class="measure-folder-empty">Aucune mesure sur cette feuille.</p>'}</div></section>`;
  });
  if(unfiled.length||!S.folders.length||allUnfiled)groups.push(`<section class="measure-folder measure-folder-unfiled"><div class="measure-unfiled-heading"><span>Non classées</span><small title="Mesures de cette feuille / du projet">${unfiled.length}/${allUnfiled}</small></div>${unfiled.length?unfiled.map(folderMeasureRow).join(''):'<p class="measure-folder-empty">Aucune mesure sur cette feuille.</p>'}</section>`);
  tree.innerHTML=groups.join('');
  if($('#newMeasureFolder')){
    $('#newMeasureFolder').disabled=busy;
    $('#newMeasureFolder').title=!S.plan?'Ouvrez un plan pour créer ses dossiers.':busy?'Attendez la fin du chargement ou de l’analyse.':'Créer un dossier de mesures';
    $('#assignMeasureFolder').disabled=busy||!selectedFolderItems().length;
    $('#assignMeasureFolder').title=!selectedFolderItems().length?'Sélectionnez une ou plusieurs mesures à classer.':'Classer les mesures sélectionnées';
  }
  $$('[data-folder-toggle]',tree).forEach(button=>button.onclick=()=>{
    const folder=S.folders.find(entry=>entry.id===button.dataset.folderToggle);if(!folder)return;
    remember();folder.collapsed=!folder.collapsed;save();refresh();
    $(`[data-folder-toggle="${folder.id}"]`)?.focus();
  });
  $$('[data-folder-rename]',tree).forEach(button=>button.onclick=()=>folderDialog(button.dataset.folderRename));
  $$('[data-folder-delete]',tree).forEach(button=>button.onclick=()=>deleteFolderDialog(button.dataset.folderDelete));
  $$('.measure-row',tree).forEach(row=>{
    row.onclick=event=>selectItem(row.dataset.item,event);
    row.onkeydown=event=>{if(event.key===' '){event.preventDefault();event.stopPropagation();selectItem(row.dataset.item,event);}else if(event.key==='Enter'){event.preventDefault();event.stopPropagation();openItemEditor(row.dataset.item);}};
  });
  lucide.createIcons({attrs:{width:16,height:16,'stroke-width':1.8}});
}
function renderFolderInspector(item) {
  const selected=selectedFolderItems(),host=$('#inspector');if(!selected.length||!host)return;
  const values=new Set(selected.map(entry=>entry.folderId||'')),mixed=values.size>1,value=mixed?'':[...values][0];
  host.insertAdjacentHTML('beforeend',`<section class="folder-inspector"><label for="assignFolderSelect">Dossier${selected.length>1?' · '+selected.length+' mesures':''}</label><select id="assignFolderSelect" ${folderBusy()?'disabled':''}>${mixed?'<option value="__mixed__" selected disabled>Plusieurs dossiers</option>':''}${folderOptions(value)}</select><button type="button" id="newFolderForSelection"><i data-lucide="folder-plus" aria-hidden="true"></i> Nouveau dossier pour la sélection</button></section>`);
  $('#assignFolderSelect').onchange=event=>{assignMeasuresToFolder(selected,event.target.value);$('#assignFolderSelect')?.focus();};
  $('#newFolderForSelection').disabled=folderBusy();
  $('#newFolderForSelection').onclick=()=>folderDialog(null,true);
}

/* Wall takeoff keeps plan lengths separate from vertical, height-dependent areas. */
const WALL_TAKEOFF_TYPES={shower:{label:'Douche',color:'#247c97'},'bath-shower':{label:'Bain-douche',color:'#a03d87'},backsplash:{label:'Dosseret de cuisine',color:'#946015'}};
function isWallTakeoff(item) {return item?.kind==='linear'&&!item.measureOnly&&item.work?.lineRole==='wall';}
function defaultWallHeight(type) {
  if(type==='shower')return 96;
  if(type==='bath-shower')return 84;
  const value=S.settings?.backsplashHeight;
  return Number.isFinite(value)&&value>0?value:null;
}
function wallSurfaceNet(points,scale,heightInches,openings=0) {
  if(!Number.isFinite(scale)||scale<=0||!Number.isFinite(heightInches)||heightInches<=0||!Number.isFinite(openings)||openings<0)return null;
  const gross=lineLength(points)*scale*heightInches/12;
  return openings>gross+1e-7?null:Math.max(0,gross-openings);
}
function wallTakeoffQuantity(item) {
  if(!isWallTakeoff(item))return null;
  const wall=item.work.wall||{};
  return wallSurfaceNet(item.points,S.scales[item.page],wall.height,wall.openings??0);
}
function wallTakeoffLabel(item) {return WALL_TAKEOFF_TYPES[item.wallTakeoff?.type]?.label||'Céramique murale / dosseret';}
function wallTakeoffColor(item) {return WALL_TAKEOFF_TYPES[item.wallTakeoff?.type]?.color||'#247c97';}
function wallTakeoffIssues(item) {
  if(!isWallTakeoff(item))return [];
  const issues=[],wall=item.work.wall||{},height=wall.height;
  if(!Number.isFinite(height)||height<=0)issues.push('hauteur murale à renseigner');
  else if(wallTakeoffQuantity(item)===null)issues.push('ouvertures murales à corriger');
  else if(wallTakeoffQuantity(item)<=0)issues.push('surface murale non positive');
  if(item.wallTakeoff?.reviewed===false)issues.push('pans de murs et ouvertures à vérifier');
  return issues;
}
function validateWallTakeoffData(item) {
  const meta=item.wallTakeoff;if(meta===undefined)return;
  if(!isWallTakeoff(item)||!meta||typeof meta!=='object'||Array.isArray(meta)||!Object.hasOwn(WALL_TAKEOFF_TYPES,meta.type)||!['auto','manual'].includes(meta.source)||typeof meta.reviewed!=='boolean')throw new Error('Le relevé mural est invalide.');
  for(const [key,limit]of [['sourceHintKey',160],['sourceLabel',240],['runKey',3000]])if(meta[key]!==undefined&&(typeof meta[key]!=='string'||meta[key].length>limit))throw new Error('La référence du relevé mural est invalide.');
  if(!item.work?.wall||!(item.work.wall.height===null||Number.isFinite(item.work.wall.height)&&item.work.wall.height>0&&item.work.wall.height<=1200))throw new Error('La hauteur du relevé mural est invalide.');
}
function wallPointKey(point) {return point.x.toFixed(2)+','+point.y.toFixed(2);}
function wallRunKey(points) {
  return points.slice(1).map((point,index)=>[wallPointKey(points[index]),wallPointKey(point)].sort().join('~')).sort().join('|');
}
function joinWallRuns(runs,tolerance=.5) {
  const remaining=runs.filter(run=>dist(run.a,run.b)>.01).map(run=>({a:{...run.a},b:{...run.b}})),chains=[];
  while(remaining.length) {
    const first=remaining.shift(),chain=[first.a,first.b];let joined=true;
    while(joined){joined=false;for(let i=0;i<remaining.length;i++){
      const edge=remaining[i],front=chain[0],back=chain.at(-1);
      if(dist(back,edge.a)<=tolerance){chain.push(edge.b);}
      else if(dist(back,edge.b)<=tolerance){chain.push(edge.a);}
      else if(dist(front,edge.b)<=tolerance){chain.unshift(edge.a);}
      else if(dist(front,edge.a)<=tolerance){chain.unshift(edge.b);}
      else continue;
      remaining.splice(i,1);joined=true;break;
    }}
    chains.push(chain);
  }
  return chains;
}
function wallRunsAtFixture(footprint,room,scale) {
  if(!footprint?.length||!room?.points?.length||!Number.isFinite(scale)||scale<=0)return [];
  const tolerance=.5/scale,runs=[];
  for(let i=0;i<footprint.length;i++) {
    const a=footprint[i],b=footprint[(i+1)%footprint.length],length=dist(a,b);if(length*scale<.5)continue;
    const ux=(b.x-a.x)/length,uy=(b.y-a.y)/length;let best=null;
    for(let j=0;j<room.points.length;j++) {
      const c=room.points[j],d=room.points[(j+1)%room.points.length],wallLength=dist(c,d);if(!wallLength)continue;
      const wx=(d.x-c.x)/wallLength,wy=(d.y-c.y)/wallLength;
      if(Math.abs(ux*wx+uy*wy)<.999)continue;
      const offset=Math.abs((c.x-a.x)*uy-(c.y-a.y)*ux);if(offset>tolerance)continue;
      const p=(c.x-a.x)*ux+(c.y-a.y)*uy,q=(d.x-a.x)*ux+(d.y-a.y)*uy,
        start=Math.max(0,Math.min(p,q)),end=Math.min(length,Math.max(p,q));
      if(end-start<length-.25/scale)continue;
      const projectedA={x:a.x+ux*start,y:a.y+uy*start},projectedB={x:a.x+ux*end,y:a.y+uy*end},
        move=point=>{const t=((point.x-c.x)*wx+(point.y-c.y)*wy);return{x:c.x+wx*t,y:c.y+wy*t};};
      if(!best||offset<best.offset)best={a:move(projectedA),b:move(projectedB),offset};
    }
    if(best&&!runs.some(run=>wallRunKey([run.a,run.b])===wallRunKey([best.a,best.b])))runs.push({a:best.a,b:best.b});
  }
  return runs;
}
function wallBacksplashHints(texts=[]) {
  return texts.filter(text=>/^(?:DOSSERET|BACKSPLASH|COMPTOIR)(?:\s|$|[:.-])/i.test(normalizeName(text.text))).map(text=>{
    const normalized=normalizeName(text.text),match=normalized.match(/\bH(?:AUTEUR)?\s*[=:]?\s*(\d+(?:[.,]\d+)?)\s*(PO|IN|PI|FT|MM|CM|["'])/),
      value=match?Number(match[1].replace(',','.')):null,
      factor=match?({PI:12,FT:12,MM:1/25.4,CM:1/2.54,"'":12}[match[2]]||1):1;
    return {...text,type:'backsplash',key:'backsplash:'+Math.round(text.cx*10)+':'+Math.round(text.cy*10),label:text.text,height:match?value*factor:null};
  });
}
function wallClosedRectangles(info) {
  const result=[],seen=new Set();
  for(const entry of [...(info.vectorFixtures||[]),...(info.vectorWalls||[])]) {
    const points=[];let closed=false,valid=true,subpaths=0;
    for(let i=0;i<entry.path.length;){const code=entry.path[i++];if(code===0){if(++subpaths>1)valid=false;points.push({x:entry.path[i++],y:entry.path[i++]});}else if(code===1)points.push({x:entry.path[i++],y:entry.path[i++]});else if(code===4)closed=true;else{valid=false;i+=code===2?6:code===3?4:0;}}
    if(!valid||points.length<4||points.length>5)continue;
    if(dist(points[0],points.at(-1))<.5){points.pop();closed=true;}
    if(!closed||points.length!==4||points.some((point,index)=>{const next=points[(index+1)%4];return Math.abs(point.x-next.x)>.5&&Math.abs(point.y-next.y)>.5;}))continue;
    const key=wallRunKey([...points,points[0]]);if(seen.has(key))continue;seen.add(key);result.push(points);
  }
  return result;
}
function wallCounterFootprint(hint,info,room,scale) {
  const possibilities=[];
  for(const points of wallClosedRectangles(info)) {
    const b=boundsOf(points),width=(b.right-b.x)*scale,depth=(b.bottom-b.y)*scale,
      short=Math.min(width,depth),long=Math.max(width,depth);
    if(short<.8||short>4||long<short*1.2||!points.every(point=>inside(point,room.points)||onRing(point,room.points)))continue;
    const dx=Math.max(b.x-hint.cx,0,hint.cx-b.right),dy=Math.max(b.y-hint.cy,0,hint.cy-b.bottom),distance=Math.hypot(dx,dy);
    if(distance*scale>2)continue;
    const runs=wallRunsAtFixture(points,room,scale);if(!runs.length)continue;
    possibilities.push({points,runs,distance});
  }
  possibilities.sort((a,b)=>a.distance-b.distance);
  if(!possibilities.length||possibilities.length>1&&Math.abs(possibilities[0].distance-possibilities[1].distance)*scale<.5)return null;
  return possibilities[0];
}
function wallCoveredIntervals(run,items,type,page,scale) {
  const length=dist(run.a,run.b);if(!length)return [];
  const ux=(run.b.x-run.a.x)/length,uy=(run.b.y-run.a.y)/length,tolerance=Math.max(.25,.02/scale),spans=[];
  for(const item of items)if(item.page===page&&isWallTakeoff(item)&&item.wallTakeoff?.type===type)for(let i=1;i<item.points.length;i++){
    const a=item.points[i-1],b=item.points[i],size=dist(a,b);if(!size||Math.abs(ux*(b.x-a.x)/size+uy*(b.y-a.y)/size)<.999)continue;
    if(Math.max(Math.abs((a.x-run.a.x)*uy-(a.y-run.a.y)*ux),Math.abs((b.x-run.a.x)*uy-(b.y-run.a.y)*ux))>tolerance)continue;
    const p=(a.x-run.a.x)*ux+(a.y-run.a.y)*uy,q=(b.x-run.a.x)*ux+(b.y-run.a.y)*uy,start=Math.max(0,Math.min(p,q)),end=Math.min(length,Math.max(p,q));
    if(end>start)spans.push([start,end]);
  }
  spans.sort((a,b)=>a[0]-b[0]);const merged=[];
  for(const span of spans){const previous=merged.at(-1);if(previous&&span[0]<=previous[1]+tolerance)previous[1]=Math.max(previous[1],span[1]);else merged.push([...span]);}
  return merged;
}
function wallUnmeasuredRuns(runs,items,type,page,scale) {
  const result=[],tolerance=Math.max(.25,.02/scale);
  for(const run of runs){const length=dist(run.a,run.b);if(!length)continue;const ux=(run.b.x-run.a.x)/length,uy=(run.b.y-run.a.y)/length,point=t=>({x:run.a.x+ux*t,y:run.a.y+uy*t});let previous=0;
    for(const [start,end]of wallCoveredIntervals(run,items,type,page,scale)){if(start-previous>tolerance)result.push({a:point(previous),b:point(start)});previous=Math.max(previous,end);}
    if(length-previous>tolerance)result.push({a:point(previous),b:{...run.b}});
  }
  return result;
}
function wallProposalRunsAlreadyMeasured(proposal) {
  return proposal.runs.map(run=>wallUnmeasuredRuns([run],S.items,proposal.type,S.page,S.scale).length===0);
}
function wallLocatedFixture(room,hint,info,scale) {
  const located=locateFixture(room,hint,info,scale);if(located)return located;
  if(!hint.widthInches||!hint.lengthInches)return null;
  const tolerance=.25/scale,candidates=[];
  for(const box of fixtureComponents(info)){
    if(hint.cx<box.x-1||hint.cx>box.right+1||hint.cy<box.y-1||hint.cy>box.bottom+1)continue;
    const points=[{x:box.x,y:box.y},{x:box.right,y:box.y},{x:box.right,y:box.bottom},{x:box.x,y:box.bottom}];
    if(!points.every(point=>inside(point,room.points)||onRing(point,room.points)||room.points.some((a,i)=>distanceToSegment(point,a,room.points[(i+1)%room.points.length])<=tolerance)))continue;
    for(const [w,h]of [[hint.widthInches,hint.lengthInches],[hint.lengthInches,hint.widthInches]]){
      const ex=Math.abs((box.right-box.x)*scale*12/w-1),ey=Math.abs((box.bottom-box.y)*scale*12/h-1);
      if(ex<=.14&&ey<=.14)candidates.push({points,score:ex+ey});
    }
  }
  candidates.sort((a,b)=>a.score-b.score);return candidates[0]||null;
}
function collectWallTakeoffProposals() {
  const info=S.pageInfo[S.page]||{},scale=S.scales[S.page],model=detectorForPage(),
    rooms=model.rooms.map(room=>roomCandidate(model,room,info,S.material,S.settings,scale)).filter(Boolean),proposals=[];
  const roomAt=point=>rooms.filter(room=>inside(point,room.points)&&!(room.holes||[]).some(hole=>inside(point,hole))).sort((a,b)=>area(a.points)-area(b.points))[0];
  for(const hint of fixtureTextHints(info.texts||[]).filter(hint=>['shower','bath-shower'].includes(hint.type))) {
    const room=roomAt({x:hint.cx,y:hint.cy}),cut=room&&(S.items.flatMap(item=>item.page===S.page?item.fixtureCuts||[]:[]).find(cut=>cut.hintKey===hint.key)||wallLocatedFixture(room,hint,info,scale)),
      runs=cut&&area(room.points)>area(cut.points)*1.15?wallRunsAtFixture(cut.points,room,scale):[];
    proposals.push({key:hint.key,type:hint.type,name:WALL_TAKEOFF_TYPES[hint.type].label+(room?.name?' · '+room.name:''),sourceLabel:hint.label,height:defaultWallHeight(hint.type),room,runs,reason:runs.length?'Pans appuyés sur les limites de la pièce. Vérifiez les murs réellement carrelés.':!cut?'Emprise dimensionnée non localisée : tracez les pans de murs.':'Aucun pan de mur appuyé sur le contour de la pièce : tracez la zone.'});
  }
  for(const hint of wallBacksplashHints(info.texts||[])) {
    const room=roomAt({x:hint.cx,y:hint.cy}),counter=room&&wallCounterFootprint(hint,info,room,scale);
    proposals.push({key:hint.key,type:'backsplash',name:'Dosseret'+(room?.name?' · '+room.name:''),sourceLabel:hint.label,height:hint.height||defaultWallHeight('backsplash'),room,runs:counter?.runs||[],reason:counter?'Contour de comptoir appuyé sur un mur, associé au libellé. Contrôlez les retours et ouvertures.':'Aucun contour de comptoir unique appuyé sur un mur : tracez les pans du dosseret.'});
  }
  return proposals;
}
function wallTakeoffWork(height,openings=0,waste=10,previous=null) {
  const base=previous?structuredClone(previous):{included:true,block:'',level:'',unit:'',type:'',repeat:1,lineRole:'wall',baseboard:{enabled:false,code:'PL-01',deductions:0,waste:5}};
  return {...base,lineRole:'wall',wall:{height,openings,waste}};
}
function createWallTakeoffItem(points,type,height,openings=0,reviewed=false,source='manual',hint=null) {
  if(!Object.hasOwn(WALL_TAKEOFF_TYPES,type)||points.length<2||lineLength(points)*S.scale<=.01)throw new Error('Tracez au moins deux points distincts du mur.');
  if(height!==null&&(!Number.isFinite(height)||height<=0||height>1200))throw new Error('Saisissez une hauteur de plus de 0 et au maximum 100 pi.');
  if(!Number.isFinite(openings)||openings<0||height===null&&openings>0||height!==null&&wallSurfaceNet(points,S.scale,height,openings)===null)throw new Error('Les ouvertures doivent rester entre zéro et la surface brute du mur.');
  const number=S.items.filter(item=>isWallTakeoff(item)&&item.wallTakeoff?.type===type).length+1,
    item={id:uid(),kind:'linear',page:S.page,name:hint?.name||WALL_TAKEOFF_TYPES[type].label+' '+number,material:'PL-01',points:structuredClone(points),qty:lineLength(points)*S.scale,waste:0,status:'à valider',method:source==='auto'?'Pans muraux proposés depuis le plan':'Pans muraux tracés',
      work:wallTakeoffWork(height,openings),wallTakeoff:{type,source,reviewed,runKey:wallRunKey(points)}};
  if(hint){item.wallTakeoff.sourceHintKey=hint.key;item.wallTakeoff.sourceLabel=hint.sourceLabel||hint.name;}
  const middle=points[Math.floor(points.length/2)],parent=S.items.find(entry=>entry.page===S.page&&entry.kind==='area'&&inside(middle,entry.points));
  if(parent?.folderId)item.folderId=parent.folderId;
  return item;
}
function wallHeightInputValue(value) {return Number.isFinite(value)?String(value/12):'';}
function readWallHeight(input) {
  const raw=input.value.trim();if(!raw)return null;
  const feet=Number(raw.replace(',','.'));if(!Number.isFinite(feet)||feet<=0||feet>100)throw new Error('Saisissez une hauteur de plus de 0 et au maximum 100 pi.');return feet*12;
}
function openWallTakeoffEditor(points,existing=null,context={}) {
  const type=existing?.wallTakeoff?.type||context.type||'backsplash',height=existing?existing.work.wall.height:context.height??defaultWallHeight(type),
    openings=existing?.work?.wall?.openings||0,reviewed=existing?.wallTakeoff?.reviewed||false,waste=existing?.work?.wall?.waste??10,
    scope=wallTakeoffWork(height,openings,waste,existing?.work);
  S.wallTakeoffPreview=[{points,type}];
  openDialog(existing?'Modifier le relevé mural':'Relever les murs et dosserets',`<form id="wallTakeoffForm"><p>${fmt(lineLength(points)*S.scale)} pi de murs tracés sur ${esc(pageName(S.page))}. Surface nette = longueur × hauteur − ouvertures.</p><div class="v4-fields"><label>Type de revêtement mural<select id="wallTakeoffType">${Object.entries(WALL_TAKEOFF_TYPES).map(([key,entry])=>`<option value="${key}" ${type===key?'selected':''}>${entry.label}</option>`).join('')}</select></label><label>Hauteur (pi)<input id="wallHeightFeet" type="number" min="0.001" max="100" step="any" value="${wallHeightInputValue(height)}" placeholder="À saisir"></label><label>Ouvertures à retrancher (pi²)<input id="wallOpenings" type="number" min="0" step="any" value="${openings}"></label><label>Perte de revêtement mural (%)<input id="wallWaste" type="number" min="0" max="1000" step="any" value="${waste}"></label></div><p class="wall-default-note">Douche : 8 pi. Bain-douche : 7 pi. La hauteur du dosseret doit être saisie ou indiquée sur le plan.</p><label class="wall-review-check"><input id="wallRunsReviewed" type="checkbox" ${reviewed?'checked':''}> J’ai vérifié les pans carrelés et les ouvertures à déduire.</label><p id="wallQuantityPreview" class="wall-quantity-preview" role="status"></p><fieldset class="wall-work-scope"><legend>Localisation et estimation</legend><label class="wall-review-check"><input id="wallWorkIncluded" type="checkbox" ${scope.included?'checked':''}> Inclure ce relevé dans l’estimation après confirmation</label><div class="v4-fields">${[['wallWorkBlock','Bloc',scope.block],['wallWorkLevel','Étage',scope.level],['wallWorkUnit','Unité / modèle',scope.unit],['wallWorkType','Type d’unité',scope.type]].map(([id,label,value])=>`<label>${label}<input id="${id}" maxlength="80" value="${esc(value)}"></label>`).join('')}<label>Répétitions<input id="wallWorkRepeat" type="number" min="1" max="999" step="1" required value="${scope.repeat}"></label></div><p>La mesure du plan reste unique. Les répétitions multiplient les quantités de l’estimation.</p></fieldset><p id="wallTakeoffError" class="v4-error" role="alert"></p><div class="modal-actions"><button type="button" id="cancelWallTakeoff">Annuler</button><button type="submit" id="saveWallTakeoff" class="primary">${existing?'Enregistrer la correction':'Ajouter au relevé · à valider'}</button></div></form>`,'wide');
  const update=()=>{try{const height=readWallHeight($('#wallHeightFeet')),net=wallSurfaceNet(points,S.scale,height,Number($('#wallOpenings').value));$('#wallQuantityPreview').textContent=net===null?'Surface à compléter : hauteur ou ouvertures à vérifier.':fmt(net)+' pi² nets · '+fmt(lineLength(points)*S.scale)+' pi × '+fmt(height/12)+' pi − '+fmt(Number($('#wallOpenings').value))+' pi²';}catch(error){$('#wallQuantityPreview').textContent=error.message;}};
  for(const id of ['wallHeightFeet','wallOpenings'])$('#'+id).oninput=update;
  $('#wallTakeoffType').onchange=event=>{const height=defaultWallHeight(event.target.value);$('#wallHeightFeet').value=wallHeightInputValue(height);S.wallTakeoffPreview=[{points,type:event.target.value}];update();};
  $('#cancelWallTakeoff').onclick=()=>{S.wallTakeoffPreview=null;closeDialog();};
  $('#wallTakeoffForm').onsubmit=event=>{event.preventDefault();try{
    const type=$('#wallTakeoffType').value,height=readWallHeight($('#wallHeightFeet')),openings=Number($('#wallOpenings').value),waste=Number($('#wallWaste').value),reviewed=$('#wallRunsReviewed').checked;
    if(!Number.isFinite(waste)||waste<0||waste>1000)throw new Error('Entrez une perte de 0 à 1 000 %.');
    if(!Number.isFinite(openings)||openings<0||height===null&&openings>0||height!==null&&wallSurfaceNet(points,S.scale,height,openings)===null)throw new Error('Les ouvertures dépassent la surface brute du mur.');
    const work={...wallTakeoffWork(height,openings,waste,existing?.work),included:$('#wallWorkIncluded').checked,block:$('#wallWorkBlock').value.trim(),level:$('#wallWorkLevel').value.trim(),unit:$('#wallWorkUnit').value.trim(),type:$('#wallWorkType').value.trim(),repeat:Number($('#wallWorkRepeat').value)};
    validateWork(work,'linear');
    if(existing){remember();existing.work=work;existing.wallTakeoff={...existing.wallTakeoff,type,source:existing.wallTakeoff?.source||'manual',reviewed,runKey:wallRunKey(points)};existing.status='à valider';}
    else{const item=createWallTakeoffItem(points,type,height,openings,reviewed,'manual',context.hint);item.work=work;remember();S.items.push(item);setSelection([item.id]);}
    S.wallTakeoffPreview=null;closeDialog();save();refresh();toast('Relevé mural enregistré, à valider avant commande.');
  }catch(error){$('#wallTakeoffError').textContent=error.message;}};
  update();
}
function startWallTakeoffTrace(context={}) {
  if(!S.plan)return toast('Ouvrez un plan pour tracer les murs.');
  if(!S.scale)return calibrationModal();
  S.wallTraceContext={...context,type:context.type||'backsplash'};
  closeDialog();if(S.reviewOpen)closeReview();activateTool('wallTrace');
}
function finishWallTakeoffTrace(points) {
  if(!S.scale)return toast('Calibrez le plan avant de relever les murs.');
  if(points.length<2||lineLength(points)*S.scale<=.01)return toast('Cliquez au moins deux points distincts sur les pans du mur.');
  const copy=structuredClone(points),context=S.wallTraceContext||{};S.draft=[];S.tool='select';refresh();canvas.focus();openWallTakeoffEditor(copy,null,context);
}
function openWallTakeoffDialog(id=null) {
  if(!S.plan)return toast('Ouvrez un plan pour relever les dosserets et les murs de douche.');
  if(!S.scale)return calibrationModal();
  const existing=S.items.find(item=>item.id===(typeof id==='string'?id:S.selected)&&isWallTakeoff(item));
  if(existing)return openWallTakeoffEditor(existing.points,existing);
  let proposals=[];try{proposals=collectWallTakeoffProposals();}catch(error){return openDialog('Relevé mural',`<p>Les pans n’ont pas pu être proposés : ${esc(error.message)}</p><p>Vous pouvez tracer les murs manuellement avec Tracer mur.</p>`);}
  const proposed=[];
  for(const proposal of proposals){
    const available=wallUnmeasuredRuns(proposal.runs,S.items,proposal.type,S.page,S.scale);
    if(!available.length)continue;
    const fresh=wallUnmeasuredRuns(available,proposed,proposal.type,S.page,S.scale);
    if(!fresh.length){proposal.runs=[];proposal.duplicateProposal=true;proposal.reason='Ces pans sont déjà proposés par une autre annotation de la même zone.';continue;}
    const original=proposal.runs.reduce((sum,run)=>sum+dist(run.a,run.b),0),remaining=fresh.reduce((sum,run)=>sum+dist(run.a,run.b),0);
    proposal.runs=fresh;
    if(remaining<original-Math.max(.25,.02/S.scale))proposal.reason='Les parties déjà relevées ou proposées ont été retranchées. Vérifiez les nouveaux pans restants.';
    for(const points of joinWallRuns(fresh))proposed.push({kind:'linear',page:S.page,points,work:{lineRole:'wall'},wallTakeoff:{type:proposal.type}});
  }
  S.wallTakeoffProposals=proposals;
  openDialog('Détecter les dosserets et murs de douche',`<div id="wallProposalList"><p>Les propositions associent un équipement ou un comptoir aux pans de murs voisins. Choisissez seulement les pans réellement carrelés. Le bain et le receveur ne sont pas des surfaces murales.</p><p class="wall-default-note">Hauteurs : douche 8 pi · bain-douche 7 pi · dosseret à saisir si absent du plan.</p>${proposals.length?proposals.map((proposal,index)=>{
    const measured=wallProposalRunsAlreadyMeasured(proposal);proposal.measured=measured;
    return `<section class="wall-proposal" data-wall-proposal="${index}"><header><strong>${esc(proposal.name)}</strong><small>${esc(proposal.sourceLabel)}</small></header><p>${esc(proposal.reason)}</p>${proposal.runs.length?`<div class="wall-pan-list">${proposal.runs.map((run,n)=>`<label><input type="checkbox" data-wall-pan="${index}:${n}" ${measured[n]?'disabled':proposal.runs.length<=3?'checked':''}> Pan ${n+1} · ${fmt(dist(run.a,run.b)*S.scale)} pi ${measured[n]?'· déjà au relevé':''}</label>`).join('')}</div><div class="v4-fields"><label>Hauteur (pi)<input type="number" min="0.001" max="100" step="any" data-wall-proposal-height="${index}" value="${wallHeightInputValue(proposal.height)}" placeholder="À saisir"></label><label>Ouvertures totales (pi²)<input type="number" min="0" step="any" data-wall-proposal-openings="${index}" value="0"></label></div><label class="wall-review-check"><input type="checkbox" data-wall-proposal-reviewed="${index}"> Pans et ouvertures vérifiés</label><p class="wall-quantity-preview" data-wall-proposal-total="${index}"></p>`:proposal.duplicateProposal?'<p class="wall-proposal-pending">Pans déjà proposés, sans quantité ajoutée en double.</p>':'<p class="wall-proposal-pending">Aucune quantité inventée : un tracé est nécessaire.</p>'}<button type="button" class="wall-trace-source" data-wall-trace-source="${index}">Tracer cette zone</button></section>`;
  }).join(''):'<p class="wall-proposal-pending">Aucun libellé de douche, bain-douche ou dosseret n’est localisé sur cette feuille. Tracez les pans à relever.</p>'}<p id="wallProposalError" class="v4-error" role="alert"></p><div class="wall-manual-row"><label>Tracé manuel<select id="wallTraceType">${Object.entries(WALL_TAKEOFF_TYPES).map(([type,entry])=>`<option value="${type}" ${type==='backsplash'?'selected':''}>${entry.label}</option>`).join('')}</select></label><button type="button" id="traceWallFromDialog">Tracer les murs</button></div><div class="modal-actions"><button type="button" id="cancelWallProposals">Fermer</button><button type="button" class="primary" id="addWallTakeoffs">Ajouter les pans choisis · à valider</button></div></div>`,'wide');
  const chosenRuns=index=>proposals[index].runs.filter((run,n)=>$(`[data-wall-pan="${index}:${n}"]`)?.checked),update=()=>{
    S.wallTakeoffPreview=[];let any=false;
    proposals.forEach((proposal,index)=>{const runs=chosenRuns(index),target=$(`[data-wall-proposal-total="${index}"]`);if(!target)return;const length=runs.reduce((sum,run)=>sum+dist(run.a,run.b)*S.scale,0);try{const height=readWallHeight($(`[data-wall-proposal-height="${index}"]`)),openings=Number($(`[data-wall-proposal-openings="${index}"]`).value),gross=height===null?null:length*height/12,net=gross===null||!Number.isFinite(openings)||openings<0||openings>gross?null:gross-openings;target.textContent=length?net===null?fmt(length)+' pi · hauteur ou ouvertures à compléter':fmt(net)+' pi² nets · '+fmt(length)+' pi × '+fmt(height/12)+' pi − '+fmt(openings)+' pi²':'Aucun pan choisi.';}catch(error){target.textContent=error.message;}if(runs.length)any=true;for(const points of joinWallRuns(runs))S.wallTakeoffPreview.push({points,type:proposal.type});});
    $('#addWallTakeoffs').disabled=!any;
  };
  $$('[data-wall-pan], [data-wall-proposal-height], [data-wall-proposal-openings]').forEach(input=>input.oninput=update);
  $$('[data-wall-trace-source]').forEach(button=>button.onclick=()=>{const proposal=proposals[+button.dataset.wallTraceSource];startWallTakeoffTrace({type:proposal.type,height:proposal.height,hint:proposal});});
  $('#traceWallFromDialog').onclick=()=>startWallTakeoffTrace({type:$('#wallTraceType').value});
  $('#cancelWallProposals').onclick=()=>{S.wallTakeoffPreview=null;closeDialog();};
  $('#addWallTakeoffs').onclick=()=>{try{
    const created=[];
    proposals.forEach((proposal,index)=>{const chosen=chosenRuns(index),runs=wallUnmeasuredRuns(chosen,[...S.items,...created],proposal.type,S.page,S.scale);if(!runs.length)return;
      const height=readWallHeight($(`[data-wall-proposal-height="${index}"]`)),openings=Number($(`[data-wall-proposal-openings="${index}"]`).value),reviewed=$(`[data-wall-proposal-reviewed="${index}"]`).checked,chains=joinWallRuns(runs);
      if(openings>0&&runs.reduce((sum,run)=>sum+dist(run.a,run.b),0)<chosen.reduce((sum,run)=>sum+dist(run.a,run.b),0)-Math.max(.25,.02/S.scale))throw new Error(proposal.name+' : certains pans sont déjà relevés. Vérifiez les ouvertures sur les pans restants.');
      if(chains.length>1&&openings>0)throw new Error(proposal.name+' : les pans sont séparés. Ajoutez-les sans déduction commune, puis renseignez les ouvertures par relevé.');
      for(const [chainIndex,points] of chains.entries()){const item=createWallTakeoffItem(points,proposal.type,height,openings,reviewed,'auto',proposal);if(chains.length>1)item.name+=' · pan '+(chainIndex+1);if(!S.items.some(old=>isWallTakeoff(old)&&old.page===item.page&&old.wallTakeoff?.type===proposal.type&&wallRunKey(old.points)===wallRunKey(item.points)))created.push(item);}
    });
    if(!created.length)throw new Error('Choisissez au moins un nouveau pan.');
    remember();S.items.push(...created);setSelection(created.map(item=>item.id));S.wallTakeoffPreview=null;closeDialog();save();refresh();toast(created.length+' relevé(s) mural(aux) ajouté(s), à valider avant commande.');
  }catch(error){$('#wallProposalError').textContent=error.message;}};
  update();
}
function appendWallTakeoffInspector(host,item) {
  if(S.selection.size!==1||!isWallTakeoff(item))return;
  const wall=item.work.wall||{},height=wall.height,quantity=wallTakeoffQuantity(item);
  host.insertAdjacentHTML('beforeend',`<section class="wall-inspector"><h3>${esc(wallTakeoffLabel(item))}</h3><p>${fmt(lineLength(item.points)*S.scales[item.page])} pi de murs · ${height===null||!Number.isFinite(height)?'hauteur à saisir':fmt(height/12)+' pi de hauteur'} · ${fmt(wall.openings||0)} pi² d’ouvertures</p><strong>${quantity===null?'Surface à compléter':fmt(quantity)+' pi² nets'}</strong><p>${item.wallTakeoff?.reviewed===false?'Pans et ouvertures à vérifier avant confirmation.':'Les quantités murales restent séparées du plancher.'}</p><button type="button" id="editWallTakeoff">Hauteur, pans et ouvertures</button></section>`);
  $('#editWallTakeoff').onclick=()=>openWallTakeoffEditor(item.points,item);
}
function drawWallTakeoffGuides(context) {
  const committed=S.items.filter(item=>item.page===S.page&&isWallTakeoff(item)).map(item=>({points:item.points,type:item.wallTakeoff?.type,item})),preview=$('#wallTakeoffForm')||$('#wallProposalList')?S.wallTakeoffPreview||[]:[];
  for(const entry of [...committed,...preview]) {
    const color=WALL_TAKEOFF_TYPES[entry.type]?.color||'#247c97',selected=entry.item&&S.selection.has(entry.item.id);
    context.save();context.beginPath();entry.points.forEach((point,index)=>index?context.lineTo(point.x,point.y):context.moveTo(point.x,point.y));context.lineJoin='round';context.lineCap='butt';context.strokeStyle=color+'50';context.lineWidth=(selected?12:9)/S.zoom;context.stroke();context.strokeStyle=color;context.lineWidth=(selected?3:2)/S.zoom;context.setLineDash(entry.item?[]:[5/S.zoom,3/S.zoom]);context.stroke();context.setLineDash([]);
    for(const point of entry.points){context.beginPath();context.arc(point.x,point.y,3/S.zoom,0,Math.PI*2);context.fillStyle='#ffffff';context.fill();context.strokeStyle=color;context.lineWidth=1/S.zoom;context.stroke();}
    if(selected){const point=entry.points[Math.floor(entry.points.length/2)],quantity=wallTakeoffQuantity(entry.item),height=entry.item.work.wall.height,label=(quantity===null?'Hauteur à saisir':fmt(quantity)+' pi²')+(Number.isFinite(height)?' · h '+fmt(height/12)+' pi':'');context.font=`600 ${11/S.zoom}px Arial`;context.textAlign='left';context.textBaseline='bottom';context.strokeStyle='#ffffff';context.lineWidth=4/S.zoom;context.strokeText(label,point.x+8/S.zoom,point.y-8/S.zoom);context.fillStyle=color;context.fillText(label,point.x+8/S.zoom,point.y-8/S.zoom);}
    context.restore();
  }
}
function wallTakeoffExportSheets() {
  const header=['Page','Feuille','Relevé','Type','Longueur (pi)','Hauteur (pi)','Ouvertures (pi²)','Net mural (pi²)','Perte (%)','Total avec perte (pi²)','Pans vérifiés','Statut','Source'],
    rows=S.items.filter(isWallTakeoff).map(item=>{const wall=item.work.wall||{},net=wallTakeoffQuantity(item);return[item.page,pageName(item.page),item.name,wallTakeoffLabel(item),+lineLength(item.points).toFixed(5)*S.scales[item.page],wall.height===null?'À saisir':wall.height/12,wall.openings,net===null?'À compléter':+net.toFixed(2),wall.waste,net===null?'À compléter':+(net*(1+wall.waste/100)).toFixed(2),item.wallTakeoff?.reviewed===false?'À vérifier':'Vérifiés',item.status,item.wallTakeoff?.sourceLabel||item.method];});
  return [['Murs et dosserets',[header,...rows]]];
}


const MATERIALS = [
  ['VP-01','Vinyle commercial','#e1b84b',6], ['CER-01','Céramique 24 x 24','#4c9e8d',10], ['CER-12X24','Céramique 12 x 24','#52a6bb',12],
  ['TAP-01','Tapis en dalle','#6686c4',7], ['BOI-01',"Bois d’ingénierie",'#b8784e',8],
  ['LAM-01','Plancher laminé','#9b7cb2',7]
].map(([code,name,color,waste])=>({code,name,color,waste}));
const TOOLS = [['select','mouse-pointer-2','Sélection','V'],['auto','wand-sparkles','Pièce au clic','A'],['area','pentagon','Surface polygonale','S'],['linear','ruler','Ligne / plinthe','L'],['calibrate','maximize','Calibrer','C'],['split','scissors','Fractionner','F']];
const S = {plan:null,pdf:null,fileName:'Aucun plan',page:1,pages:1,tool:'select',zoom:.82,pan:{x:40,y:54},scale:null,draft:[],items:readSaved('quantif-items',[]),selected:null,selection:new Set(),material:'VP-01',history:[],redo:[],project:'Projet sans titre',scales:readSaved('quantif-scales',{}),scaleMeta:{},pageInfo:{},tileGrid:true,documentKey:'legacy',loadVersion:0,renderVersion:0,loading:false};
const $=(q,e=document)=>e.querySelector(q), $$=(q,e=document)=>[...e.querySelectorAll(q)];
const fmt=(n,d=1)=>Number(n||0).toLocaleString('fr-CA',{minimumFractionDigits:d,maximumFractionDigits:d});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), uid=()=>Math.random().toString(36).slice(2,10);
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.y-b.x*a.y},0)/2);
const perimeter=p=>p.reduce((s,a,i)=>s+dist(a,p[(i+1)%p.length]),0);
const inside=(p,poly)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x))hit=!hit}return hit};
const mat=c=>MATERIALS.find(m=>m.code===c)||MATERIALS[0];

$('#root').innerHTML=`<div class="app">
<header class="topbar"><div class="brand"><div class="brandmark"><i data-lucide="layers-3"></i></div><span>QUANTIF</span><b>PLANCHER</b></div><div class="menu"><button class="active">Accueil</button><button>Plan</button><button>Mesures</button><button id="estimateNav">Estimation</button><button id="catalogNav">Assemblages</button><button id="reportNav">Rapports</button></div><div class="project-title"><input id="projectName" value="Projet sans titre"><span id="fileName">Aucun plan</span></div><div class="top-actions"><button class="outline" id="takeoffBtn"><i data-lucide="file-text"></i> Rapport <span id="count">0</span></button><button class="primary" id="exportBtn"><i data-lucide="download"></i> Excel</button></div></header>
<section class="ribbon"><div class="ribbon-group"><button id="uploadBtn"><i data-lucide="folder-open"></i><span>Ouvrir<br>un plan</span></button><input id="fileInput" hidden type="file" accept="application/pdf,image/*"><button id="demoBtn"><i data-lucide="file-text"></i><span>Plan<br>d’exemple</span></button><small>Projet</small></div><div class="ribbon-group compact"><button id="undo" title="Annuler"><i data-lucide="undo-2"></i><span>Annuler</span></button><button id="redo" title="Rétablir · Ctrl+Y"><i data-lucide="redo-2"></i><span>Rétablir</span></button><button id="deleteSelection" title="Supprimer la sélection · Suppr"><i data-lucide="trash-2"></i><span>Supprimer</span></button><small>Historique</small></div><div class="ribbon-group" id="tools"></div><div class="ribbon-group"><button id="tileSettings" title="Calepinage des carreaux"><i data-lucide="grid-3x3"></i><span>Carreaux<br>12×24 / 24×24</span></button><button id="toggleTileGrid" title="Afficher la trame de carreaux"><i data-lucide="layout-grid"></i><span>Trame<br>ON/OFF</span></button><small>Céramique</small></div><div class="ribbon-group ai-group"><button class="ai-action" id="aiAnalyze"><i data-lucide="sparkles"></i><span>Analyse IA<br><b>Tout quantifier</b></span></button><button id="aiReview"><i data-lucide="list-checks"></i><span>Réviser<br>les détections</span></button><small>Détection des pièces</small></div><div class="ribbon-group compact"><button type="button" id="saveProjectBtn" title="Sauvegarder le relevé · Ctrl+S"><i data-lucide="save"></i><span>Sauvegarder<br>le relevé</span></button><input id="projectInput" hidden type="file" accept=".json"><button type="button" id="helpBtn" title="Souris et raccourcis · ?"><i data-lucide="keyboard"></i><span>Souris et<br>raccourcis</span></button><small>Relevé et aide</small></div></section>
<div class="workspace"><aside class="sidebar"><div class="pane-title"><span>PROJET ET PAGES</span><button><i data-lucide="panel-left-close"></i></button></div><div class="side-tabs"><button class="active">Pages</button><button>Takeoff</button></div><div class="side-search"><i data-lucide="search"></i><input placeholder="Rechercher"></div><div class="tree"><div class="tree-root"><i data-lucide="folder-open"></i><b id="treeProject">Projet sans titre</b></div><div class="tree-page active"><i data-lucide="file-text"></i><span id="treeFile">Aucun plan</span><em id="treePageCount">0 page</em></div></div><div class="pane-title split-title"><span>MESURES DU PLAN</span><b id="zoneCount">0</b></div><div class="measure-tree" id="measureTree"><p>Aucune quantité mesurée</p></div></aside>
<main class="stage"><div class="stagebar"><div class="document"><i data-lucide="file-text"></i><strong id="stageFile">Aucun plan</strong><div class="pages" id="pages" hidden><button id="prevPage">‹</button><span id="pageNum">1 / 1</span><button id="nextPage">›</button></div></div><button type="button" class="scale" id="scaleStatus" aria-label="Réglages de l’échelle"><span class="dot"></span><span>Échelle non calibrée</span></button></div><div class="canvas-wrap"><canvas id="planCanvas"></canvas><button class="empty-demo" id="emptyDemo">Ouvrir le plan d’exemple</button><div class="zoom"><button id="zoomOut"><i data-lucide="minus"></i></button><span id="zoomText">82 %</span><button id="zoomIn"><i data-lucide="plus"></i></button></div><div class="hint" id="hint" hidden></div></div><section class="quantity-grid"><div class="grid-head"><b>QUANTITÉS</b><span id="gridSummary">0 zone · 0,0 pi²</span><button id="collapseGrid"><i data-lucide="chevron-down"></i></button></div><div class="grid-scroll"><table><thead><tr><th>Pièce / zone</th><th>Code</th><th>Type</th><th>Net</th><th>Perte</th><th>Total</th><th>Statut</th></tr></thead><tbody id="gridRows"><tr><td colspan="7" class="grid-empty">Lancez l’analyse IA ou tracez une surface pour commencer.</td></tr></tbody></table></div></section></main>
<aside class="inspector" id="inspector"></aside><button class="reopen" id="reopen" hidden><i data-lucide="panel-right-open"></i></button></div><div id="overlay"></div><div id="toast" class="toast" hidden></div></div>`;
$('#tools').innerHTML=TOOLS.map(([id,icon,label,key])=>`<button data-tool="${id}" title="${label} (${key})"><i data-lucide="${icon}"></i><span>${label}</span><kbd>${key}</kbd></button>`).join('')+'<small>Mesurer et naviguer</small>';
lucide.createIcons({attrs:{width:18,height:18,'stroke-width':1.8}});
const canvas=$('#planCanvas'), ctx=canvas.getContext('2d');

function demoPlan(){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="780"><rect width="1200" height="780" fill="#f8f7f3"/><g stroke="#2d3431" fill="none" stroke-width="8"><rect x="96" y="86" width="996" height="590"/><path d="M96 350h390V86M486 350v326M486 350h334M820 86v264M820 350h272M820 350v326M486 520h334"/></g><g stroke="#f8f7f3" stroke-width="13"><path d="M260 350h70M486 230v75M640 350h80M820 220v72M820 460v70"/></g><g fill="#1f2723" font-family="Arial" text-anchor="middle"><text x="290" y="200" font-size="26">BUREAU 101</text><text x="290" y="235" font-size="18">VP-01</text><text x="650" y="200" font-size="26">RÉCEPTION 102</text><text x="650" y="235" font-size="18">CER-01</text><text x="950" y="200" font-size="26">CHAMBRE 103</text><text x="950" y="235" font-size="18">TAP-01</text><text x="290" y="500" font-size="26">BUREAU 104</text><text x="290" y="535" font-size="18">VP-01</text><text x="650" y="440" font-size="26">CORRIDOR</text><text x="650" y="475" font-size="18">CER-01</text><text x="650" y="600" font-size="24">SALLE DE BAIN</text><text x="650" y="635" font-size="18">CER-12X24</text><text x="950" y="510" font-size="26">CUISINE 106</text><text x="950" y="545" font-size="18">CER-01</text></g><g stroke="#b6beb8" stroke-width="2"><path d="M96 725h996M96 711v28M1092 711v28"/></g><text x="594" y="755" font-family="Arial" font-size="18" text-anchor="middle" fill="#444">50'-0&quot;</text></svg>`;return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
function toast(t){const e=$('#toast');e.innerHTML=`<i data-lucide="check"></i>${esc(t)}`;e.hidden=false;lucide.createIcons();clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2600)}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left-S.pan.x)/S.zoom,y:(e.clientY-r.top-S.pan.y)/S.zoom}}
function finishLine(points){if(!S.scale)return toast('Calibrez d’abord le plan.');const qty=points.slice(1).reduce((s,p,i)=>s+dist(points[i],p),0)*S.scale,item={id:uid(),kind:'linear',name:`Plinthe ${S.items.filter(i=>i.kind==='linear').length+1}`,material:'PL-01',points:[...points],qty,waste:5,page:S.page,status:'à valider',method:'Tracé linéaire'};if(!S.scaleMeta[S.page]?.verified)item.status='à valider';pushItems([...S.items,item]);setSelection([item.id]);S.draft=[];S.tool='select';refresh()}
function draw() {
  const d=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
  if(canvas.width!==w*d||canvas.height!==h*d){canvas.width=w*d;canvas.height=h*d;}
  ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#dfe2df';ctx.fillRect(0,0,w,h);
  ctx.save();ctx.translate(S.pan.x,S.pan.y);ctx.scale(S.zoom,S.zoom);
  if(S.plan){ctx.shadowColor='#0f18132d';ctx.shadowBlur=22;ctx.shadowOffsetY=8;ctx.drawImage(S.plan,0,0);ctx.shadowColor='transparent';}
  for(const item of S.items.filter(item=>item.page===S.page)) {
    const active=S.selection.has(item.id),color=colorForItem(item);ctx.save();
    if(item.kind==='count'){drawCountItem(ctx,item,active);ctx.restore();continue;}
    if(item.kind==='area') {
      ctx.save();clipItem(ctx,item);ctx.fillStyle=surfaceFillForItem(item);const b=boundsOf(item.points);ctx.fillRect(b.x,b.y,b.right-b.x,b.bottom-b.y);ctx.restore();traceItem(ctx,item);
    }else {ctx.beginPath();item.points.forEach((point,index)=>index?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));}
    ctx.strokeStyle=active?'#101713':color;ctx.lineWidth=(active?4:2)/S.zoom;ctx.stroke();
    if(item.kind==='area'&&active&&S.selection.size===1&&!S.settings.surfaceLabels)drawSurfaceLabel(ctx,item,true);
    else drawManualLineDecorations(ctx,item);
    ctx.restore();
  }
  if(S.draft.length&&!['count','rectangle','segment','dimension'].includes(S.tool)) {
    ctx.beginPath();S.draft.forEach((p,index)=>index?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#df5e43';ctx.lineWidth=2/S.zoom;ctx.setLineDash([8/S.zoom,5/S.zoom]);ctx.stroke();ctx.setLineDash([]);
    for(const p of S.draft){ctx.beginPath();ctx.arc(p.x,p.y,5/S.zoom,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#df5e43';ctx.stroke();}
  }
  drawTileGrids(ctx);drawWallInspection(ctx);drawGuides(ctx);drawSurfaceLabels(ctx);drawFixtureGuides(ctx);drawManualGuides(ctx);drawWallTakeoffGuides(ctx);drawReference(ctx);ctx.restore();
  if(!S.plan){ctx.fillStyle='#55605a';ctx.font='600 17px Arial';ctx.textAlign='center';ctx.fillText('Ouvrez un plan PDF ou une image pour commencer',w/2,h/2-10);ctx.font='14px Arial';ctx.fillStyle='#7b847f';ctx.fillText('ou ouvrez le plan d’exemple',w/2,h/2+18);}
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
function itemQuantityText(item,withWaste=false) {
  if(hasPendingFixtures(item))return 'À délimiter';
  const quantity=displayQuantityForItem(item);if(quantity===null)return 'À compléter';
  const value=withWaste?quantity*(1+displayWasteForItem(item)/100):quantity;
  return fmt(value,item.kind==='count'?0:1)+' '+unitForItem(item);
}
function displayQuantityForItem(item) {return isWallTakeoff(item)?wallTakeoffQuantity(item):item.qty;}
function displayWasteForItem(item) {return isWallTakeoff(item)?workOf(item).wall.waste:item.waste;}
function displayCodeForItem(item) {return isWallTakeoff(item)?'MUR-01':item.material;}
function confirmedWallTotal() {return S.items.filter(item=>isWallTakeoff(item)&&isConfirmed(item)).reduce((sum,item)=>sum+(wallTakeoffQuantity(item)||0)*(1+displayWasteForItem(item)/100),0);}
function totals(){return MATERIALS.map(m=>{const r=S.items.filter(i=>i.kind==='area'&&isConfirmed(i)&&i.material===m.code);return{...m,count:r.length,net:r.reduce((s,i)=>s+i.qty,0),total:r.reduce((s,i)=>s+i.qty*(1+i.waste/100),0)}}).filter(i=>i.count)}
function renderInspectorBase() {
  const host=$('#inspector');if(S.selection.size>1)return renderMultipleInspector(host);
  const item=S.items.find(item=>item.id===S.selected);
  if(item) {
    host.innerHTML=`<div class="panel-head"><div><span>INSPECTEUR</span><h2>${esc(labelForItem(item))}</h2></div></div>
      <label>Nom du relevé<input id="itemName" maxlength="300" value="${esc(item.name)}"></label>
      ${item.kind==='area'?`<label>Type d’espace<select id="itemSpaceType">${Object.entries(SPACE_STYLES).map(([type,style])=>`<option value="${type}" ${surfaceSpaceType(item)===type?'selected':''}>${style.label}</option>`).join('')}</select></label><label>Fini<select id="itemMaterial">${MATERIALS.map(material=>`<option value="${material.code}" ${material.code===item.material?'selected':''}>${material.code} · ${esc(material.name)}</option>`).join('')}</select></label>`:''}
      <div class="quantity"><span>${item.kind==='count'?'NOMBRE D’ÉLÉMENTS':isWallTakeoff(item)?'SURFACE MURALE NETTE':'QUANTITÉ NETTE'}</span><strong>${hasPendingFixtures(item)?'À délimiter':displayQuantityForItem(item)===null?'À compléter':fmt(displayQuantityForItem(item),item.kind==='count'?0:1)} <small>${unitForItem(item)}</small></strong></div>
      ${item.kind!=='count'&&!item.measureOnly&&!isWallTakeoff(item)?`<label>Perte<div class="input-unit"><input id="itemWaste" type="number" min="0" max="1000" value="${item.waste}"><span>%</span></div></label><div class="total-line"><span>Total avec perte</span><b>${itemQuantityText(item,true)}</b></div>`:''}
      ${item.kind==='area'?`<div class="total-line"><span>Périmètre indicatif</span><b>${fmt(perimeter(item.points)*S.scales[item.page])} pi</b></div>`:''}
      ${item.measureOnly?'<p class="selection-help">Cote de référence : exclue des commandes et des plinthes.</p>':''}
      <label>Statut<select id="itemStatus">${['confirmée','estimée','à valider'].map(status=>`<option ${status===item.status?'selected':''}>${status}</option>`).join('')}</select></label>
      <div class="status-note"><i data-lucide="check"></i><span>Page ${item.page}<small>${esc(item.method)}${item.kind==='count'?' · échelle non requise':S.scaleMeta[item.page]?.verified?'':' · échelle à vérifier'}</small></span></div><button class="danger" id="deleteItem"><i data-lucide="trash-2"></i> Supprimer le relevé</button>`;
    $('#itemName').onchange=event=>updateItem(item.id,{name:event.target.value});
    if($('#itemMaterial'))$('#itemMaterial').onchange=event=>updateItem(item.id,{material:event.target.value});
    if($('#itemSpaceType'))$('#itemSpaceType').onchange=event=>updateItem(item.id,{spaceType:event.target.value,bathroom:event.target.value==='bathroom'});
    if($('#itemWaste'))$('#itemWaste').onchange=event=>updateItem(item.id,{waste:+event.target.value});
    $('#itemStatus').onchange=event=>updateItem(item.id,{status:event.target.value});$('#deleteItem').onclick=deleteSelection;
  } else {
    const ts=totals(),lin=S.items.filter(item=>item.kind==='linear'&&!item.measureOnly&&!isWallTakeoff(item)&&isConfirmed(item)).reduce((sum,item)=>sum+item.qty*(1+item.waste/100),0),count=S.items.filter(item=>item.kind==='count'&&isConfirmed(item)).reduce((sum,item)=>sum+item.qty,0);
    host.innerHTML=`<div class="panel-head"><div><span>BIBLIOTHÈQUE</span><h2>Finis et assemblages</h2></div></div><div class="panel-section"><span>MATÉRIAU ACTIF</span><div class="library-list">${MATERIALS.map(material=>`<div class="library-item ${material.code===S.material?'active':''}" data-material="${material.code}" role="button" tabindex="0"><i style="background:${material.color}"></i><span><b>${material.code}</b><small>${esc(material.name)}</small></span><em>${material.waste}%</em></div>`).join('')}</div></div><div class="panel-section"><span>RELEVÉ CONFIRMÉ</span>${ts.map(total=>`<div class="mini-total"><i style="background:${total.color}"></i><div><b>${total.code}</b><small>${total.count} zone(s)</small></div><strong>${fmt(total.total)} pi²</strong></div>`).join('')}${lin?`<p>Plinthes : <b>${fmt(lin)} pi</b></p>`:''}${count?`<p>Comptage : <b>${fmt(count,0)} u</b></p>`:''}${confirmedWallTotal()?`<p>Murs et dosserets : <b>${fmt(confirmedWallTotal())} pi²</b></p>`:''}${!ts.length&&!lin&&!count&&!confirmedWallTotal()?'<p class="empty-copy">Tracez une surface, une ligne ou comptez les éléments avec le ruban manuel.</p>':''}</div>${!S.scale?'<div class="warning"><i data-lucide="triangle-alert"></i><div><b>Échelle à régler pour les mesures</b><span>Le comptage reste utilisable sans calibration.</span></div></div>':''}`;
    $$('.library-item',host).forEach(button=>{button.onclick=()=>{S.material=button.dataset.material;renderInspector();};button.onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();button.click();}};});
  }
  $$('.closePanel',host).forEach(button=>button.onclick=()=>{host.hidden=true;$('#reopen').hidden=false;});lucide.createIcons({attrs:{width:17,height:17}});
}
function takeoffDrawer() {
  const ts=totals(),lin=S.items.filter(item=>item.kind==='linear'&&!item.measureOnly&&!isWallTakeoff(item)&&isConfirmed(item)).reduce((sum,item)=>sum+item.qty*(1+item.waste/100),0),count=S.items.filter(item=>item.kind==='count'&&isConfirmed(item)).reduce((sum,item)=>sum+item.qty,0),overlay=$('#overlay');
  overlay.innerHTML=`<div class="drawer-back"><section class="takeoff"><header><div><span>RELEVÉ</span><h2>Quantités du projet</h2></div><button class="icon-btn" id="closeDrawer" aria-label="Fermer le rapport"><i data-lucide="x"></i></button></header><div class="takeoff-summary"><div><span>Plancher confirmé avec perte</span><strong>${fmt(ts.reduce((sum,total)=>sum+total.total,0))} pi²</strong></div><div><span>Plinthes confirmées</span><strong>${fmt(lin)} pi</strong></div><div><span>Éléments confirmés</span><strong>${fmt(count,0)} u</strong></div><div><span>Murs et dosserets avec perte</span><strong>${fmt(confirmedWallTotal())} pi²</strong></div></div><div class="search"><i data-lucide="search"></i><input id="searchRows" placeholder="Rechercher une pièce ou un fini" aria-label="Rechercher dans le rapport"></div><div class="table-wrap"><table><thead><tr><th>Pièce / relevé</th><th>Type / référence</th><th>Net</th><th>Perte</th><th>Total</th><th>Statut</th></tr></thead><tbody>${S.items.map(item=>`<tr data-id="${item.id}" data-search="${esc((item.name+item.material).toLowerCase())}"><td><b>${esc(item.name)}</b><small>Page ${item.page}</small></td><td>${esc(labelForItem(item))}<small>${esc(displayCodeForItem(item))}</small></td><td>${itemQuantityText(item)}</td><td>${displayWasteForItem(item)}%</td><td>${itemQuantityText(item,true)}</td><td>${esc(item.status)}${item.measureOnly?'<small>Référence · hors commandes</small>':''}</td></tr>`).join('')}</tbody></table></div><footer><p>Les surfaces et longueurs demandent une échelle vérifiée. Le comptage donne des unités sans échelle. Les cotes restent hors commandes ; les autres relevés doivent être confirmés avant approvisionnement.</p><button class="primary" id="drawerExport"><i data-lucide="download"></i> Exporter Excel</button></footer></section></div>`;
  lucide.createIcons();$('#closeDrawer').onclick=()=>overlay.innerHTML='';$('.drawer-back').onclick=event=>{if(event.target.classList.contains('drawer-back'))overlay.innerHTML='';};
  $$('tbody tr',overlay).forEach(row=>row.onclick=async()=>{const item=S.items.find(item=>item.id===row.dataset.id);overlay.innerHTML='';if(item&&item.page!==S.page&&S.pdf)await showPage(item.page);if(item){setSelection([item.id]);refresh();}});
  $('#searchRows').oninput=event=>$$('tbody tr',overlay).forEach(row=>row.hidden=!row.dataset.search.includes(event.target.value.toLowerCase()));$('#drawerExport').onclick=exportExcel;
}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function sheetXml(rows){return`<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((r,ri)=>`<row r="${ri+1}">${r.map((v,ci)=>{let col='',n=ci+1;while(n){col=String.fromCharCode(65+(n-1)%26)+col;n=Math.floor((n-1)/26);}return typeof v==='number'?`<c r="${col}${ri+1}"><v>${v}</v></c>`:`<c r="${col}${ri+1}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`}).join('')}</row>`).join('')}</sheetData></worksheet>`}
async function exportExcel(){const rows=S.items.map(i=>[pageName(i.page),i.name,displayCodeForItem(i),labelForItem(i),hasPendingFixtures(i)?'À délimiter':displayQuantityForItem(i)===null?'À compléter':+displayQuantityForItem(i).toFixed(2),displayWasteForItem(i),hasPendingFixtures(i)?'À délimiter':displayQuantityForItem(i)===null?'À compléter':+(displayQuantityForItem(i)*(1+displayWasteForItem(i)/100)).toFixed(2),unitForItem(i),i.page,i.method,i.status,i.measureOnly?'Référence · exclue des commandes':i.kind==='count'?'Comptage · échelle non requise':S.scaleMeta[i.page]?.verified?'Échelle vérifiée':'Échelle à vérifier']),summary=[['Type','Code','Quantité nette','Quantité totale','Unité'],...totals().map(t=>[t.name,t.code,+t.net.toFixed(2),+t.total.toFixed(2),'pi²'])],detail=[['Niveau','Pièce / zone','Code de fini','Type','Quantité nette','Perte (%)','Quantité totale','Unité','Page source','Méthode','Statut','Note'],...rows],controls=[['Contrôle','Valeur'],['Échelle',S.scale?`1 px = ${S.scale.toFixed(5)} pi`:'À calibrer'],['Plan',S.fileName],['Bains/douches à délimiter',S.items.filter(hasPendingFixtures).map(i=>'Page '+i.page+' · '+i.name).join(' / ')||'Aucun équipement signalé en attente'],['Pages analysées',[...new Set(S.items.map(i=>i.page))].join(', ')||'Aucune'],...Object.entries(S.scales).map(([page,scale])=>['Échelle page '+page,(S.scaleMeta[page]?.label||'Cote manuelle')+' · '+(S.scaleMeta[page]?.verified?'vérifiée':'à vérifier')+' · 1 px = '+scale.toFixed(7)+' pi'])],sheets=[['Résumé',summary],['Détail par pièce',detail],['Plinthes et moulures',[detail[0],...rows.filter((row,index)=>S.items[index].kind==='linear'&&!S.items[index].measureOnly&&!isWallTakeoff(S.items[index]))]],['Comptages',[detail[0],...rows.filter((row,index)=>S.items[index].kind==='count')]],['Cotes de référence',[detail[0],...rows.filter((row,index)=>S.items[index].measureOnly)]],['Contrôles',controls],['Calepinage',[['Feuille','Pièce','Format','Angle (degrés)','Joint (po)','Départ X depuis bord gauche (pi)','Départ Y depuis bord haut (pi)','Minimum avec perte (hors réemploi)'],...S.items.filter(i=>i.kind==='area'&&i.material.startsWith('CER')).map(i=>{const f=tileLayout(i),scale=S.scales[i.page];return [pageName(i.page),i.name,mat(i.material).name,f.angle,f.joint,+(f.origin.x*scale).toFixed(4),+(f.origin.y*scale).toFixed(4),hasPendingFixtures(i)?'À délimiter':Math.ceil(i.qty*(1+i.waste/100)/(i.material==='CER-12X24'?2:4))];})]],...estimationSheets(),...fixtureExportSheets(),...wallTakeoffExportSheets()],zip=new JSZip();zip.file('[Content_Types].xml',`<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);zip.folder('_rels').file('.rels',`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);const xl=zip.folder('xl');xl.file('workbook.xml',`<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${esc(s[0])}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`);xl.folder('_rels').file('workbook.xml.rels',`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`);const ws=xl.folder('worksheets');sheets.forEach((s,i)=>ws.file(`sheet${i+1}.xml`,sheetXml(s[1])));const blob=await zip.generateAsync({type:'blob'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${S.project.replace(/[^a-z0-9]/gi,'_')}_takeoff.xlsx`;a.click();toast('Classeur Excel exporté.')}


/* Calibration and selection: all coordinates remain in the rendered plan. */
const PDF_RENDER_SCALE = 1.65;
const PDF_DPI = 72 * PDF_RENDER_SCALE;

function readSaved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save() {
  try {
    const record = {items:S.items,folders:S.folders||[],scales:S.scales,scaleMeta:S.scaleMeta,project:S.project,sheetNames:S.sheetNames,settings:S.settings,dividers:S.dividers,detectBounds:S.detectBounds,estimation:S.estimation};
    if (S.documentKey === 'legacy') {
      localStorage.setItem('quantif-items', JSON.stringify(S.items));
      localStorage.setItem('quantif-scales', JSON.stringify(S.scales));
    } localStorage.setItem('quantif-document-v3:' + S.documentKey, JSON.stringify(record));
  } catch {
    if (!S.storageWarning) { S.storageWarning = true; toast('Sauvegarde locale indisponible. Exportez vos quantités avant de fermer.'); }
  }
}
function snapshot() {
  return structuredClone({items:S.items, folders:S.folders||[],scales:S.scales, scaleMeta:S.scaleMeta,
    selected:S.selected,selection:[...S.selection],sheetNames:S.sheetNames,settings:S.settings,dividers:S.dividers,detectBounds:S.detectBounds,project:S.project,estimation:S.estimation,
    reviewByPage:S.reviewByPage||{},reviewOpen:!!S.reviewOpen,previewFocus:S.previewFocus});
}
function remember() {
  S.history.push(snapshot()); S.history = S.history.slice(-40); S.redo = [];
}
function restoreSnapshot(state) {
  S.items = state.items; S.scales = state.scales; S.scaleMeta = state.scaleMeta;
  S.selection = new Set(state.selection.filter(id => S.items.some(i => i.id === id && i.page === S.page)));
  S.selected = S.selection.has(state.selected) ? state.selected : [...S.selection].at(-1) || null;
  S.folders=state.folders||[];S.reviewByPage=state.reviewByPage||{};S.reviewOpen=!!state.reviewOpen;S.previewFocus=state.previewFocus??null;
  S.preview=S.reviewOpen?{page:S.page,items:S.reviewByPage[S.page]?.items||[]}:null;
  if(!S.reviewOpen){$('#reviewPanel').hidden=true;$('.app').classList.remove('review-open');}
  S.draft=[];S.sheetNames=state.sheetNames||{};S.settings=state.settings||S.settings;S.dividers=state.dividers||{};S.detectBounds=state.detectBounds||{};S.project=state.project||S.project;S.estimation=state.estimation||{catalog:{},group:'project'};S.detectorCache=null;save();refresh();
}
function undoChange() {
  if (!S.history.length) return;
  S.redo.push(snapshot()); restoreSnapshot(S.history.pop());
}
function redoChange() {
  if (!S.redo.length) return;
  S.history.push(snapshot()); restoreSnapshot(S.redo.pop());
}
function pushItems(items) { remember(); S.items = items; save(); refresh(); }
function setSelection(ids) {
  S.selection = new Set(ids); S.selected = [...S.selection].at(-1) || null;
}
function selectItem(id, event = {}) {
  S.previewFocus=null;
  const itemsOnPage=S.items.filter(item=>item.page===S.page),fromFolders=event.target?.closest?.('#measureTree');
  const visible=fromFolders?$$('.measure-row',$('#measureTree')).filter(row=>row.getClientRects().length).map(row=>itemsOnPage.find(item=>item.id===row.dataset.item)).filter(Boolean):itemsOnPage;
  if (!visible.some(i => i.id === id)) return;
  if (event.shiftKey && S.anchorId && visible.some(i => i.id === S.anchorId)) {
    const a = visible.findIndex(i => i.id === S.anchorId), b = visible.findIndex(i => i.id === id);
    setSelection(visible.slice(Math.min(a,b), Math.max(a,b)+1).map(i => i.id));
  } else if (event.ctrlKey || event.metaKey || event.shiftKey) {
    const next = new Set(S.selection); next.has(id) ? next.delete(id) : next.add(id);
    setSelection(next); S.anchorId = id;
  } else { setSelection([id]); S.anchorId = id; }
  refresh();
}
function lineLength(points) { return points.slice(1).reduce((sum,p,i) => sum + dist(points[i],p),0); }
function applyScale(scale, meta, allPages = false) {
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('Échelle invalide.');
  remember();
  const pages = allPages && S.pdf ? Array.from({length:S.pages},(_,i) => i+1) : [S.page];
  for (const page of pages) {
    S.scales[page] = scale;
    S.scaleMeta[page] = {...structuredClone(meta), verified:page === S.page && !!meta.verified};
    if (page !== S.page) {
      S.scaleMeta[page].source = 'copied';
      S.scaleMeta[page].referenceLine = null;
      S.scaleMeta[page].fromPage = S.page;
    }
    recalculatePage(page);
    S.items = S.items.map(i => i.page === page&&i.kind!=='count' ? {...i,status:'à valider'} : i);
    if(S.reviewByPage)delete S.reviewByPage[page];
  }
  S.scale = S.scales[S.page]; save(); refresh();
}
function fractionNumber(value) {
  const s = String(value).trim().replace(/,/g,'.');
  if (/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
  const m = s.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  return m && +m[3] > 0 ? +(m[1] || 0) + +m[2] / +m[3] : NaN;
}
function parseScaleText(input) {
  const fractions = {'¼':'1/4','½':'1/2','¾':'3/4','⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8'};
  const text = String(input).replace(/[¼½¾⅛⅜⅝⅞]/g,(value,index,source)=>(/\d/.test(source[index-1] || '')?' ':'')+fractions[value])
    .replace(/[’‘′]/g,"'").replace(/[“”″]/g,'"').normalize('NFKC').replace(/⁄/g,'/');
  // Do not combine a view number on the previous line with a fractional scale.
  const number = '(?:\\d+[ \\t]+\\d+[ \\t]*\\/[ \\t]*\\d+|\\d+[ \\t]*\\/[ \\t]*\\d+|\\d+(?:[.,]\\d+)?)';
  const inch = '(?:"|po(?:uces?)?\\.?|in(?:ches?)?\\.?)';
  const foot = "(?:'|pi(?:eds?)?\\.?|ft\\.?)";
  const imperial = new RegExp('('+number+')[ \\t]*'+inch+'[ \\t]*=[ \\t]*(\\d+(?:[.,]\\d+)?)[ \\t]*'+foot+'(?:[ \\t]*[-–]?[ \\t]*('+number+')[ \\t]*'+inch+')?', 'gi');
  const candidates = [];
  const add = (denominator,label) => {
    if (Number.isFinite(denominator) && denominator > 0 && !candidates.some(c => Math.abs(c.denominator-denominator) < 1e-5))
      candidates.push({denominator,feetPerInch:denominator/12,label});
  };
  for (const m of text.matchAll(imperial)) {
    const paperInches = fractionNumber(m[1]);
    const feet = Number(m[2].replace(',','.')) + (m[3] ? fractionNumber(m[3])/12 : 0);
    if (paperInches > 0 && feet > 0) add(feet*12/paperInches, m[0].replace(/\s+/g,' ').trim());
  }
  for (const m of text.matchAll(/\b1\s*:\s*(\d+(?:[.,]\d+)?)(?!\d)/g)) {
    const denominator = Number(m[1].replace(',','.'));
    if (denominator >= 2) add(denominator,'1:' + denominator);
  }
  // A slash alone is usually a dimension fraction, so require its scale label.
  for (const m of text.matchAll(/(?:échelle|echelle|scale)\s*:?\s*1\s*\/\s*(\d{2,5})(?!\d)/gi)) add(+m[1],'1:' + m[1]);
  return {candidates, ambiguous:candidates.length > 1 || /comme\s+indiqu|as\s+indicated/i.test(text)};
}
function pdfTextLines(items) {
  const rows = [];
  for (const item of items) {
    if (!item.str || !item.transform) continue;
    const y = item.transform[5], x = item.transform[4];
    let row = rows.find(r => Math.abs(r.y-y) < 2);
    if (!row) { row = {y,items:[]}; rows.push(row); }
    row.items.push({x,text:item.str});
  }
  return rows.sort((a,b) => b.y-a.y).map(r => r.items.sort((a,b) => a.x-b.x).map(i => i.text).join(' ')).join('\n');
}
function imperialFeet(feet,inches,numerator,denominator) {
  const values = [feet,inches,numerator,denominator].map(v => Number(String(v).replace(',','.')));
  const [f,i,n,d] = values;
  if (!values.every(Number.isFinite) || !Number.isInteger(f) || !Number.isInteger(i) || !Number.isInteger(n) || !Number.isInteger(d) ||
      f < 0 || i < 0 || i >= 12 || n < 0 || d <= 0 || n >= d) throw new Error('Utilisez des pieds entiers, 0 à 11 pouces et une fraction inférieure à 1 avec un dénominateur positif.');
  const value = f + (i+n/d)/12;
  if (value <= 0) throw new Error('La longueur connue doit être supérieure à zéro.');
  return value;
}
function formatFeet(value) {
  const total = Math.round(value*192), feet = Math.floor(total/192), inches = Math.floor(total%192/16);
  let n = total%16, d = 16;
  while (n && n%2 === 0) { n /= 2; d /= 2; }
  return feet + "′ " + inches + (n ? ' '+n+'/'+d : '') + '″';
}
function decodeImage(src) { return new Promise((resolve,reject) => {const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Image illisible.')); image.src = src;}); }
async function loadImage(src,name='Plan exemple') {
  const image = await decodeImage(src); S.plan = image; S.fileName = name; fitPlan(image); refresh();
}
function openDocument(key,name,pdf,pages) {
  save();
  const record = readSaved('quantif-document-v3:'+key,{});
  if(S.detectJob)S.detectJob.cancelled=true;S.reviewByPage={};S.reviewOpen=false;S.detectionNotes=[];S.detectJob=null;if($('#reviewPanel')){$('#reviewPanel').hidden=true;$('.app').classList.remove('review-open');}
  S.documentKey = key; S.fileName = name; S.pdf = pdf; S.pages = pages; S.page = 1;
  S.items = Array.isArray(record.items) ? record.items : [];S.folders=Array.isArray(record.folders)?record.folders:[];
  S.scales=record.scales||{};S.scaleMeta=record.scaleMeta||{};S.pageInfo={};S.sheetNames=record.sheetNames||{};S.settings={doorInches:36,minArea:1,threshold:180,bathroomMaterial:'CER-12X24',surfaceDisplay:'spaces',surfaceLabels:true,...record.settings};S.dividers=record.dividers||{};S.detectBounds=record.detectBounds||{};S.estimation=record.estimation||{catalog:{},group:'project'};S.detectorCache=null;S.preview=null;S.indexedPages=0;S.indexing=false;++S.indexToken;
  S.project = record.project || S.project; S.history = []; S.redo = []; S.draft = [];
  S.plan=null;S.scale=null;S.tool='select';setSelection([]);S.anchorId=null;S.dragging=null;S.panning=null;S.mouseWorld=null;S.fixtureDrawing=null;S.fixtureEditing=null;S.fixturePreview=null;$('#overlay').innerHTML='';
}
async function loadFile(file) {
  if (!file) return;
  const token = ++S.loadVersion; ++S.renderVersion; S.loading = true; refresh();
  try {
    const data = await file.arrayBuffer();
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      const pdf = await pdfjsLib.getDocument({data}).promise;
      if (token !== S.loadVersion) { await pdf.destroy(); return; }
      const key = 'pdf:' + (pdf.fingerprints?.[0] || file.name+':'+file.size+':'+file.lastModified);
      openDocument(key,file.name,pdf,pdf.numPages);await showPage(1);if(token===S.loadVersion&&S.pdf===pdf)S.indexTask=indexDocument(pdf).catch(()=>{S.indexing=false;refresh();});
    } else {
      const objectUrl = URL.createObjectURL(new Blob([data],{type:file.type}));
      let image; try { image = await decodeImage(objectUrl); } finally { URL.revokeObjectURL(objectUrl); }
      if (token !== S.loadVersion) return;
      openDocument('image:'+file.name+':'+file.size+':'+file.lastModified,file.name,null,1);
      S.plan = image; S.scale = S.scales[1] || null; fitPlan(image); S.loading = false; refresh();
    }
  } catch (error) {
    if (token === S.loadVersion) { S.loading = false; refresh(); toast('Impossible d’ouvrir ce plan : '+error.message); }
  }
}
async function showPage(number) {
  if (!S.pdf || number < 1 || number > S.pages) return;
  const token = ++S.renderVersion, document = S.pdf;
  S.loading = true; refresh();
  try {
    const page = await document.getPage(number), viewport = page.getViewport({scale:PDF_RENDER_SCALE});
    const offscreen = window.document.createElement('canvas');
    offscreen.width = Math.ceil(viewport.width); offscreen.height = Math.ceil(viewport.height);
    const [,info] = await Promise.all([page.render({canvasContext:offscreen.getContext('2d'),viewport}).promise, inspectPdfScale(page,true)]);
    const image = await decodeImage(offscreen.toDataURL());
    if (token !== S.renderVersion || document !== S.pdf) return;
    S.page=number;S.plan=image;S.pageInfo[number]=info;rememberSheet(number,info);S.detectorCache=null;S.preview=null;S.dragging=null;S.tool='select'; S.draft = []; setSelection([]); S.anchorId = null;
    if (!S.scales[number] && info.candidates.length === 1 && !info.ambiguous) {
      const candidate = info.candidates[0]; S.scales[number] = candidate.feetPerInch / PDF_DPI;
      S.scaleMeta[number] = {...candidate,source:'automatic',verified:false}; recalculatePage(number);
    }
    S.scale = S.scales[number] || null; S.loading = false; fitPlan(image); save(); refresh();
  } catch (error) {
    if (token === S.renderVersion) { S.loading = false; refresh(); toast('Cette feuille ne peut pas être affichée : '+error.message); }
  }
}
function closeCalibration() {
  $('#overlay').innerHTML = ''; S.draft = []; S.tool = 'select'; refresh();
  (S.dialogReturnFocus?.isConnected?S.dialogReturnFocus:canvas).focus?.();
}
function calibrationModal(initialMode) {
  if (!S.plan || S.loading) return toast('Ouvrez une feuille avant de régler son échelle.');
  S.dialogReturnFocus = document.activeElement;
  const info = {candidates:[],ambiguous:false,...S.pageInfo[S.page]}, meta = S.scaleMeta[S.page];
  const hasLine = S.draft.length === 2 && dist(...S.draft) > 1;
  const pixels = hasLine ? dist(...S.draft) : 0;
  const mode = initialMode || (hasLine ? 'imperial' : S.pdf && info.candidates.length ? 'automatic' : 'imperial');
  const o = $('#overlay');
  o.innerHTML = `<div class="modal-back"><form class="cal-modal scale-modal" role="dialog" aria-modal="true" aria-labelledby="scaleTitle" novalidate>
    <div class="scale-heading"><div><h2 id="scaleTitle">Échelle de la feuille ${S.page}</h2><p>Les surfaces et les longueurs seront recalculées.</p></div><button type="button" id="closeCal" class="icon-btn" aria-label="Fermer">×</button></div>
    <p class="scale-current">${meta ? esc(meta.label || 'Échelle par cote') + (meta.verified ? ' · vérifiée sur une cote' : ' · à vérifier sur une cote') : 'Cette feuille n’est pas encore calibrée.'}</p>
    <div class="scale-tabs" role="tablist" aria-label="Méthode de calibration">${[['automatic','Automatique'],['imperial','Pieds / pouces'],['metric','Métrique'],['paper','Échelle papier']].map(([id,label])=>`<button type="button" role="tab" id="tab-${id}" data-mode="${id}" aria-controls="scale-${id}">${label}</button>`).join('')}</div>
    <fieldset id="scale-automatic" class="scale-fields" role="tabpanel" aria-labelledby="tab-automatic"><legend>Lecture du PDF</legend>
      ${info.candidates.length ? `<label for="detectedScale">Échelle reconnue dans la feuille</label><select id="detectedScale">${info.candidates.map((c,i)=>`<option value="${i}">${esc(c.label)}</option>`).join('')}</select><p class="scale-help">${info.ambiguous ? 'Cette feuille contient plusieurs échelles ou la mention « Comme indiqué ». Choisissez celle de la vue à mesurer.' : 'Échelle lue dans le texte du PDF. Contrôlez une cote connue avant de confirmer vos quantités.'}</p>` : `<p class="scale-help">${S.pdf ? 'Aucune échelle reconnue dans le texte de cette feuille.' : 'La lecture automatique est disponible pour les PDF contenant du texte.'} Tracez une cote connue pour calibrer manuellement.</p>`}
      <p class="scale-help">Une image numérisée ou un PDF redimensionné doit être vérifié manuellement.</p>
    </fieldset>
    <fieldset id="scale-imperial" class="scale-fields" role="tabpanel" aria-labelledby="tab-imperial"><legend>Longueur réelle de la cote</legend>
      <div class="imperial-fields"><label for="knownFeet">Pieds<input id="knownFeet" type="number" min="0" step="1" inputmode="numeric" value="0"></label><label for="knownInches">Pouces<input id="knownInches" type="number" min="0" max="11" step="1" inputmode="numeric" value="0"></label><div><span class="field-label" id="fractionLabel">Fraction de pouce</span><div class="fraction-fields" role="group" aria-labelledby="fractionLabel"><input id="fractionNumerator" aria-label="Numérateur de la fraction" type="number" min="0" step="1" value="0"><span>/</span><input id="fractionDenominator" aria-label="Dénominateur de la fraction" type="number" min="1" step="1" value="16"></div></div></div><p class="scale-help">Exemple : 20 pieds, 6 pouces et 3/16.</p>
    </fieldset>
    <fieldset id="scale-metric" class="scale-fields" role="tabpanel" aria-labelledby="tab-metric"><legend>Longueur réelle de la cote</legend><label for="knownMetric">Longueur connue</label><div class="metric-fields"><input id="knownMetric" type="number" min="0" step="any" inputmode="decimal"><select id="metricUnit" aria-label="Unité métrique"><option value="m">mètres</option><option value="cm">centimètres</option><option value="mm">millimètres</option></select></div></fieldset>
    <fieldset id="scale-paper" class="scale-fields" role="tabpanel" aria-labelledby="tab-paper"><legend>Rapport sur le papier</legend><label for="paperRatio">Échelle 1 : dénominateur</label><input id="paperRatio" type="number" min="1" step="any" value="${meta?.denominator || 48}"><p class="scale-help">1/4 po = 1 pi correspond à 1:48. Le rapport papier s’applique aux PDF et reste à vérifier sur une cote.</p></fieldset>
    <div id="referenceHelp" class="scale-reference"><span>${hasLine ? 'Deux points sélectionnés.' + (S.scale ? ' Selon l’échelle actuelle : '+formatFeet(pixels*S.scale)+'.' : '') : 'Sélectionnez les deux extrémités d’une cote sur le plan.'}</span><button type="button" id="traceScale">${hasLine ? 'Retracer la cote' : 'Tracer une cote'}</button></div>
    <label class="scale-check" id="referenceOption"><input type="checkbox" id="showReference" checked> Afficher la cote de vérification sur le plan</label>
    <label class="scale-check" ${S.pdf && S.pages > 1 ? '' : 'hidden'}><input type="checkbox" id="applyAllScales"> Appliquer ce rapport aux ${S.pages} feuilles du PDF</label><p class="scale-help" id="allScaleHelp" hidden>Les autres feuilles resteront à vérifier, notamment les détails à une échelle différente.</p>
    <p id="scaleError" class="scale-error" role="alert" hidden></p><div class="modal-actions"><button type="button" id="cancelCal">Annuler</button><button type="submit" class="primary" id="applyCalibration">Appliquer l’échelle</button></div></form></div>`;
  let currentMode = mode;
  const setMode = value => {
    currentMode = value;
    for (const name of ['automatic','imperial','metric','paper']) {
      const panel = $('#scale-'+name); panel.hidden = name !== value; panel.disabled = name !== value;
      const tab = $('#tab-'+name); tab.setAttribute('aria-selected',String(name === value)); tab.tabIndex = name === value ? 0 : -1;
    }
    const manual = value === 'imperial' || value === 'metric';
    $('#referenceHelp').hidden = !manual; $('#referenceOption').hidden = !manual;
    $('#applyCalibration').disabled = manual ? !hasLine : value === 'automatic' ? !S.pdf || !info.candidates.length : !S.pdf;
    $('#applyCalibration').textContent = manual ? 'Appliquer et vérifier' : 'Appliquer l’échelle';
    $('#scaleError').hidden = true;
  };
  $$('[data-mode]',o).forEach(button => {
    button.onclick = () => setMode(button.dataset.mode);
    button.onkeydown = event => {
      const modes=['automatic','imperial','metric','paper']; let index=modes.indexOf(button.dataset.mode);
      if (event.key==='ArrowRight') index=(index+1)%modes.length;
      else if (event.key==='ArrowLeft') index=(index+modes.length-1)%modes.length;
      else if (event.key==='Home') index=0;
      else if (event.key==='End') index=modes.length-1;
      else return;
      event.preventDefault(); setMode(modes[index]); $('#tab-'+modes[index]).focus();
    };
  });
  $('#applyAllScales').onchange = event => $('#allScaleHelp').hidden = !event.target.checked;
  $('#cancelCal').onclick = closeCalibration; $('#closeCal').onclick = closeCalibration;
  $('#traceScale').onclick = () => { o.innerHTML = ''; S.draft = []; S.tool = 'calibrate'; S.calibrationMode = currentMode === 'metric' ? 'metric' : 'imperial'; refresh(); canvas.focus(); };
  $('form',o).onsubmit = event => {
    event.preventDefault();
    try {
      let scale, detail;
      if (currentMode === 'automatic') {
        const candidate = info.candidates[Number($('#detectedScale')?.value || 0)];
        if (!S.pdf || !candidate) throw new Error('Aucune échelle automatique disponible. Tracez une cote connue.');
        scale = candidate.feetPerInch / PDF_DPI; detail = {...candidate,source:'automatic',verified:false};
      } else if (currentMode === 'paper') {
        const denominator = Number($('#paperRatio').value.replace(',','.'));
        if (!S.pdf || !Number.isFinite(denominator) || denominator < 1) throw new Error('Entrez un rapport papier positif pour un PDF.');
        scale = denominator / (12*PDF_DPI); detail = {denominator,label:'1:'+denominator,source:'paper',verified:false};
      } else {
        if (!hasLine) throw new Error('Tracez d’abord les deux extrémités d’une cote.');
        let feet;
        if (currentMode === 'imperial') feet = imperialFeet($('#knownFeet').value,$('#knownInches').value,$('#fractionNumerator').value,$('#fractionDenominator').value);
        else {
          const value = Number($('#knownMetric').value.replace(',','.'));
          if (!Number.isFinite(value) || value <= 0) throw new Error('Entrez une longueur métrique supérieure à zéro.');
          feet = value * ({m:1,cm:.01,mm:.001}[$('#metricUnit').value]) / .3048;
        }
        scale = feet/pixels;
        detail = {label:'Cote '+formatFeet(feet),source:'manual',verified:true,
          denominator:S.pdf ? scale*PDF_DPI*12 : null,
          deviation:S.scale ? Math.abs(pixels*S.scale-feet)/feet*100 : null,
          referenceLine:$('#showReference').checked ? {points:structuredClone(S.draft),feet} : null};
      }
      applyScale(scale,detail,$('#applyAllScales').checked);
      closeCalibration(); toast(detail.verified ? 'Échelle vérifiée. Quantités recalculées.' : 'Échelle appliquée. Vérifiez une cote connue.');
    } catch(error) { $('#scaleError').textContent = error.message; $('#scaleError').hidden = false; }
  };
  setMode(mode); $('#tab-'+mode).focus();
}
function drawReference(context) {
  const reference = S.scaleMeta[S.page]?.referenceLine;
  if (!reference) return;
  const [a,b] = reference.points;
  context.save(); context.strokeStyle = '#185eae'; context.fillStyle = '#123e70'; context.lineWidth = 2/S.zoom;
  context.beginPath(); context.moveTo(a.x,a.y); context.lineTo(b.x,b.y); context.stroke();
  for (const point of [a,b]) { context.beginPath(); context.arc(point.x,point.y,4/S.zoom,0,Math.PI*2); context.fill(); }
  context.font = `600 ${13/S.zoom}px Arial`; context.textAlign = 'center';
  context.fillText(formatFeet(reference.feet),(a.x+b.x)/2,(a.y+b.y)/2-9/S.zoom); context.restore();
}
function distanceToSegment(p,a,b) {
  const dx=b.x-a.x, dy=b.y-a.y, length=dx*dx+dy*dy;
  const t=length ? Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)) : 0;
  return dist(p,{x:a.x+t*dx,y:a.y+t*dy});
}
function hitItem(point) {
  return [...S.items].reverse().find(item=>item.page===S.page&&(item.kind==='area'?insideItem(point,item):item.kind==='count'?
    item.points.some(marker=>dist(marker,point)<=10/S.zoom):item.points.slice(1).some((p,index)=>distanceToSegment(point,item.points[index],p)<=8/S.zoom)));
}
function renderMultipleInspector(element) {
  const selected=S.items.filter(i=>S.selection.has(i.id) && i.page===S.page);
  const surfaces=selected.filter(i=>i.kind==='area'&&!hasPendingFixtures(i)).reduce((sum,i)=>sum+i.qty,0);
  const lengths=selected.filter(i=>i.kind==='linear'&&!i.measureOnly&&!isWallTakeoff(i)).reduce((sum,i)=>sum+i.qty,0),counts=selected.filter(i=>i.kind==='count').reduce((sum,i)=>sum+i.qty,0),walls=selected.filter(isWallTakeoff).reduce((sum,item)=>sum+(wallTakeoffQuantity(item)||0),0);
  element.innerHTML=`<div class="panel-head"><div><span>SÉLECTION MULTIPLE</span><h2>${selected.length} mesures sélectionnées</h2></div></div><div class="panel-section"><p class="selection-help">Ctrl/Cmd+clic pour ajouter ou retirer une mesure. Maj+clic dans la liste pour sélectionner une plage.</p><div class="total-line"><span>Surfaces nettes</span><b>${fmt(surfaces)} pi²</b></div><div class="total-line"><span>Longueurs nettes</span><b>${fmt(lengths)} pi</b></div><div class="total-line"><span>Éléments comptés</span><b>${fmt(counts,0)} u</b></div></div><div class="panel-section"><button type="button" class="selection-action" id="clearSelection">Désélectionner · Échap</button><button type="button" class="selection-action danger" id="deleteItem">Supprimer la sélection · Suppr</button><p class="selection-help">Ctrl/Cmd+Z : annuler<br>Ctrl/Cmd+Y ou Ctrl/Cmd+Maj+Z : rétablir</p></div>`;
  $('#clearSelection').onclick=()=>{setSelection([]);refresh();}; $('#deleteItem').onclick=deleteSelection;
  if(selected.some(isWallTakeoff))$('.panel-section',element).insertAdjacentHTML('beforeend',`<div class="total-line"><span>Murs et dosserets nets</span><b>${fmt(walls)} pi²${selected.some(item=>isWallTakeoff(item)&&wallTakeoffQuantity(item)===null)?' · à compléter':''}</b></div>`);
}
function refreshBase() {
  S.scale = S.scales[S.page] || null;
  S.selection = new Set([...S.selection].filter(id=>S.items.some(i=>i.id===id && i.page===S.page)));
  if (S.selected && !S.selection.has(S.selected) && S.items.some(i=>i.id===S.selected && i.page===S.page)) setSelection([S.selected]);
  S.selected = S.selection.has(S.selected) ? S.selected : [...S.selection].at(-1) || null;
  $('#fileName').textContent=S.fileName; $('#stageFile').textContent=S.fileName; $('#treeFile').textContent=S.fileName;
  $('#treeProject').textContent=S.project;
  if (document.activeElement !== $('#projectName')) $('#projectName').value=S.project;
  $('#count').textContent=S.items.length; $('#zoneCount').textContent=S.items.length;
  $('#treePageCount').textContent=`${S.pages} page${S.pages>1?'s':''}`;
  $('#zoomText').textContent=`${Math.round(S.zoom*100)} %`;
  $('#emptyDemo').hidden=!!S.plan; $('#hint').hidden=!S.plan;
  $('#hint').textContent=S.loading ? 'Chargement de la feuille…' : {
    area:'Cliquez les coins, puis Entrée ou double-clic pour terminer',
    linear:'Tracez le parcours, puis Entrée ou double-clic',
    calibrate:'Cliquez les deux extrémités d’une cote connue',
    split:'Cliquez deux points pour définir la ligne de découpe',
    auto:'Cliquez au centre d’une pièce fermée',
    select:'Double-clic : modifier la surface · Ctrl/Cmd+clic : sélection multiple · Suppr : supprimer · Échap : désélectionner'
  }[S.tool];
  $$('[data-tool]').forEach(button=>button.classList.toggle('active',button.dataset.tool===S.tool));
  const meta=S.scaleMeta[S.page], info=S.pageInfo[S.page], status=$('#scaleStatus');
  status.classList.toggle('ok',!!S.scale && !!meta?.verified);
  status.classList.toggle('needs-check',!!S.scale && !meta?.verified);
  status.lastElementChild.textContent=S.loading ? 'Chargement…' : S.scale ?
    `Page ${S.page} · ${meta?.label || 'Échelle par cote'} · ${meta?.verified?'vérifiée':'à vérifier'}` :
    info?.ambiguous ? 'Plusieurs échelles · choisir une vue' : 'Échelle non calibrée';
  status.title='Ouvrir les réglages d’échelle et vérifier une cote connue';
  $('#pages').hidden=S.pages<=1; $('#pageNum').textContent=`${S.page} / ${S.pages}`;
  $('#prevPage').disabled=S.loading || S.page<=1; $('#nextPage').disabled=S.loading || S.page>=S.pages;
  $('#deleteSelection').disabled=!hasDeletableSelection() || S.loading;
  const visible=S.items.filter(i=>i.page===S.page), surface=visible.filter(i=>i.kind==='area'&&!hasPendingFixtures(i)).reduce((sum,i)=>sum+i.qty*(1+i.waste/100),0),walls=visible.filter(isWallTakeoff),wallTotal=walls.some(item=>wallTakeoffQuantity(item)===null)?'à compléter':fmt(walls.reduce((sum,item)=>sum+wallTakeoffQuantity(item)*(1+displayWasteForItem(item)/100),0))+' pi²';
  $('#gridSummary').textContent=`${visible.length} zone${visible.length!==1?'s':''} · ${walls.length?'sol ':''}${fmt(surface)} pi²${walls.length?' · murs '+wallTotal:''}${visible.some(hasPendingFixtures)?' · bain/douche à délimiter':''}${S.selection.size?' · '+S.selection.size+' sélectionnée(s)':''}`;
  renderMeasureTree(visible);
  $('#gridRows').innerHTML=visible.length ? visible.map(i=>`<tr class="${S.selection.has(i.id)?'selected':''}" data-item="${i.id}" tabindex="0" aria-selected="${S.selection.has(i.id)}"><td><b>${esc(i.name)}</b></td><td>${esc(displayCodeForItem(i))}</td><td>${labelForItem(i)}</td><td>${itemQuantityText(i)}</td><td>${fmt(displayWasteForItem(i))}%</td><td><b>${itemQuantityText(i,true)}</b></td><td><span class="badge ${esc(i.status.replace('à ',''))}">${esc(i.status)}</span></td></tr>`).join('') : '<tr><td colspan="7" class="grid-empty">Tracez une surface ou lancez la détection pour commencer.</td></tr>';
  bindMeasureRowEvents(); renderInspector();
}


function pageName(page) {
  const s=S.sheetNames[page]||S.pageInfo[page]||{};
  return s.custom||[s.code,s.title].filter(Boolean).join(' · ')||'Feuille '+page;
}
function rememberSheet(number,info) {
  const prior=S.sheetNames[number]||{};
  S.sheetNames[number]={...prior,code:info.code||prior.code||'',title:info.title||prior.title||''};
}
async function indexDocument(pdf) {
  const token=++S.indexToken,key=S.documentKey;S.indexing=true;renderPages();
  let labels=[];try{labels=await pdf.getPageLabels()||[];}catch{}
  try {
    for(let n=1;n<=pdf.numPages;n++) {
      if(token!==S.indexToken||S.pdf!==pdf||S.documentKey!==key)return;
      const info=S.pageInfo[n]||await inspectPdfScale(await pdf.getPage(n));
      if(token!==S.indexToken||S.pdf!==pdf)return;
      if(!info.code&&labels[n-1]&&/^[A-Z]/.test(labels[n-1]))info.code=labels[n-1];
      S.pageInfo[n]=info;rememberSheet(n,info);
      if(!S.scales[n]&&info.candidates.length===1&&!info.ambiguous) {
        const candidate=info.candidates[0];S.scales[n]=candidate.feetPerInch/PDF_DPI;
        S.scaleMeta[n]={...candidate,source:'automatic',verified:false};recalculatePage(n);
      }
      S.indexedPages=n;renderPages();
      if(n===S.page)refresh();
      await new Promise(resolve=>setTimeout(resolve,0));
    }
  }finally {
    if(token===S.indexToken&&S.pdf===pdf){S.indexing=false;save();refresh();}
  }
}
function renderPages() {
  const host=$('#sheetList');if(!host)return;
  const query=normalizeName($('#sheetSearch')?.value||'');
  host.innerHTML=Array.from({length:S.pages},(_,i)=>i+1).filter(n=>!query||normalizeName(pageName(n)).includes(query)||String(n)===query).map(n=>{
    const meta=S.scaleMeta[n],scale=S.scales[n];
    return `<button class="sheet-row ${n===S.page?'active':''}" type="button" data-sheet="${n}" aria-current="${n===S.page?'page':'false'}" title="${esc(pageName(n))}"><span class="sheet-number">${n}</span><span><b>${esc(pageName(n))}</b><small>${scale?esc(meta?.label||'Cote manuelle')+(meta?.verified?' · vérifiée':' · à vérifier'):S.pageInfo[n]?.ambiguous?'Échelles multiples':S.indexing&&!S.pageInfo[n]?'Lecture…':'Échelle à régler'}</small></span></button>`;
  }).join('');
  if(!host.innerHTML)host.innerHTML='<p class="selection-help">Aucune feuille correspondante.</p>';
  $$('[data-sheet]',host).forEach(button=>button.onclick=()=>{if(S.pdf&&!S.loading)showPage(+button.dataset.sheet);});
  const status=$('#sheetIndexStatus');if(status)status.textContent=S.indexing?`Lecture des feuilles ${S.indexedPages||0} / ${S.pages}`:`${S.pages} feuille${S.pages>1?'s':''}`;
}
function renameSheet() {
  if(!S.plan)return toast('Ouvrez une feuille.');
  openDialog('Nom de la feuille',`<form id="renameSheetForm"><label for="customSheetName">Nom affiché</label><input id="customSheetName" maxlength="140" value="${esc(pageName(S.page))}"><p>Le nom automatique peut être rétabli à tout moment.</p><div class="modal-actions"><button type="button" id="autoSheetName">Rétablir le nom automatique</button><button type="submit" class="primary">Enregistrer</button></div></form>`);
  $('#renameSheetForm').onsubmit=event=>{event.preventDefault();const value=$('#customSheetName').value.trim();if(!value)return;remember();S.sheetNames[S.page]={...S.sheetNames[S.page],custom:value};save();closeDialog();refresh();};
  $('#autoSheetName').onclick=()=>{remember();if(S.sheetNames[S.page])delete S.sheetNames[S.page].custom;save();closeDialog();refresh();};
}

function tileLayout(item) {
  const b=boundsOf(item.points),layout=item.layout||{};
  return {origin:layout.origin||{x:b.x,y:b.y},angle:layout.angle||0,joint:layout.joint??.125};
}
function tileFrame(item,scale=S.scales[item.page]) {
  const layout=tileLayout(item),angle=layout.angle*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  return {...layout,c,s,width:(item.material==='CER-12X24'?12:24)/12/scale,
    height:2/scale,pitchX:((item.material==='CER-12X24'?12:24)+layout.joint)/12/scale,
    pitchY:(24+layout.joint)/12/scale,
    local:p=>({x:(p.x-layout.origin.x)*c+(p.y-layout.origin.y)*s,y:-(p.x-layout.origin.x)*s+(p.y-layout.origin.y)*c}),
    world:p=>({x:layout.origin.x+p.x*c-p.y*s,y:layout.origin.y+p.x*s+p.y*c})};
}
function setTileOrigin(id,point,record=true) {
  const item=S.items.find(i=>i.id===id&&i.page===S.page&&i.material.startsWith('CER'));
  if(!item||!Number.isFinite(point.x)||!Number.isFinite(point.y))return false;
  if(record)remember();item.layout={...tileLayout(item),origin:{x:point.x,y:point.y}};
  if(record){save();refresh();}return true;
}
function activateOrigin() {
  const item=S.items.find(i=>i.id===S.selected&&i.kind==='area'&&i.material.startsWith('CER'));
  if(!item)return toast('Sélectionnez une zone de céramique, puis appuyez sur T.');
  S.tool='tileOrigin';S.draft=[];refresh();canvas.focus();
}
function rotateTile(step=90) {
  const item=S.items.find(i=>i.id===S.selected&&i.material.startsWith('CER'));if(!item)return toast('Sélectionnez une zone de céramique.');
  updateItem(item.id,{layout:{...tileLayout(item),angle:((tileLayout(item).angle+step)%360+360)%360}});
}
function drawTileGrids(context) {
  if(!S.scale)return;
  for(const item of S.items.filter(i=>i.page===S.page&&i.kind==='area'&&i.material.startsWith('CER'))) {
    const f=tileFrame(item),b=boundsOf(item.points.map(f.local));
    if(S.tileGrid&&f.pitchX*S.zoom>=3&&f.pitchY*S.zoom>=3) {
      context.save();clipItem(context,item);
      context.translate(f.origin.x,f.origin.y);context.rotate(f.angle*Math.PI/180);
      context.strokeStyle='rgba(10,70,90,.55)';context.lineWidth=1/S.zoom;
      let count=0;
      for(let n=Math.floor(b.x/f.pitchX);n<=Math.ceil(b.right/f.pitchX)&&count++<2000;n++) {
        context.beginPath();context.moveTo(n*f.pitchX,b.y);context.lineTo(n*f.pitchX,b.bottom);context.stroke();
        if(f.joint/12/S.scale*S.zoom>1.5){context.beginPath();context.moveTo(n*f.pitchX+f.width,b.y);context.lineTo(n*f.pitchX+f.width,b.bottom);context.stroke();}
      }
      count=0;
      for(let n=Math.floor(b.y/f.pitchY);n<=Math.ceil(b.bottom/f.pitchY)&&count++<2000;n++) {
        context.beginPath();context.moveTo(b.x,n*f.pitchY);context.lineTo(b.right,n*f.pitchY);context.stroke();
        if(f.joint/12/S.scale*S.zoom>1.5){context.beginPath();context.moveTo(b.x,n*f.pitchY+f.height);context.lineTo(b.right,n*f.pitchY+f.height);context.stroke();}
      }
      context.restore();
    }
    if(S.selection.has(item.id)) {
      context.save();context.translate(f.origin.x,f.origin.y);context.rotate(f.angle*Math.PI/180);
      const r=10/S.zoom;context.strokeStyle='#b73f24';context.lineWidth=2/S.zoom;
      context.fillStyle='#ffffff';context.beginPath();context.arc(0,0,5/S.zoom,0,Math.PI*2);context.fill();context.stroke();
      context.beginPath();context.moveTo(-r,0);context.lineTo(3*r,0);context.moveTo(0,-r);context.lineTo(0,r);
      context.moveTo(2.4*r,-.4*r);context.lineTo(3*r,0);context.lineTo(2.4*r,.4*r);context.stroke();context.restore();
    }
  }
}
function tileModal() {
  const item=S.items.find(i=>i.id===S.selected&&i.kind==='area');if(!item)return toast('Sélectionnez une surface pour régler la céramique.');
  const f=tileLayout(item),b=boundsOf(item.points),scale=S.scales[item.page];
  openDialog('Calepinage de la céramique',`<form id="tileForm"><div class="v4-fields"><label>Format<select id="tileFormat"><option value="CER-12X24" ${item.material==='CER-12X24'?'selected':''}>12 × 24 po</option><option value="CER-01" ${item.material!=='CER-12X24'?'selected':''}>24 × 24 po</option></select></label><label>Angle de pose (°)<input id="tileAngle" type="number" min="-360" max="360" step="any" value="${f.angle}"></label><label>Joint (po)<input id="tileJoint" type="number" min="0" max="1" step="0.03125" value="${f.joint}"></label><label>Décalage horizontal (po)<input id="tileOffsetX" type="number" step="any" value="${((f.origin.x-b.x)*scale*12).toFixed(3)}"></label><label>Décalage vertical (po)<input id="tileOffsetY" type="number" step="any" value="${((f.origin.y-b.y)*scale*12).toFixed(3)}"></label></div><p>Décalages depuis le coin supérieur gauche de la zone. T permet de choisir le point de départ directement sur le plan; O tourne la trame de 90°.</p><p>La trame montre les coupes aux murs. Les quantités restent calculées par superficie et perte, sans réutilisation automatique des retailles.</p><p id="tileError" class="v4-error" hidden></p><div class="modal-actions"><button type="button" id="tileReset">Remettre le départ au coin</button><button class="primary" type="submit">Appliquer</button></div></form>`);
  $('#tileReset').onclick=()=>{$('#tileOffsetX').value='0';$('#tileOffsetY').value='0';};
  $('#tileForm').onsubmit=event=>{
    event.preventDefault();const angle=Number($('#tileAngle').value),joint=Number($('#tileJoint').value),dx=Number($('#tileOffsetX').value),dy=Number($('#tileOffsetY').value),material=$('#tileFormat').value;
    if(![angle,joint,dx,dy].every(Number.isFinite)||joint<0||joint>1||Math.abs(angle)>360||Math.abs(dx)>12000||Math.abs(dy)>12000) {
      $('#tileError').hidden=false;$('#tileError').textContent='Vérifiez l’angle, le joint de 0 à 1 po et les décalages.';return;
    }
    updateItem(item.id,{material,waste:material!==item.material?mat(material).waste:item.waste,layout:{origin:{x:b.x+dx/12/scale,y:b.y+dy/12/scale},angle:(angle%360+360)%360,joint}});
    closeDialog();
  };
}

function detectorForPage() {
  const key=JSON.stringify([S.documentKey,S.page,S.settings,S.scales[S.page],S.dividers[S.page],S.detectBounds[S.page]]);
  if(S.detectorCache?.image===S.plan&&S.detectorCache.key===key)return S.detectorCache.model;
  const model=makeWallModel(S.plan,S.pageInfo[S.page],S.settings,S.scale,S.dividers[S.page]||[],S.detectBounds[S.page]);
  S.detectorCache={key,image:S.plan,model};return model;
}
function duplicateCandidate(candidate,item) {
  const a=boundsOf(candidate.points),b=boundsOf(item.points),tol=Math.max(2,1/(S.scales[candidate.page]||S.scale||1)*.08);
  return Math.abs(a.x-b.x)<tol&&Math.abs(a.y-b.y)<tol&&Math.abs(a.right-b.right)<tol&&Math.abs(a.bottom-b.bottom)<tol&&
    Math.abs(area(candidate.points)-area(item.points))/Math.max(1,area(item.points))<.015;
}
function candidateAlreadyMeasured(candidate,items=S.items) {
  const current=items.filter(item=>item.page===candidate.page&&item.kind==='area');
  if(current.some(item=>duplicateCandidate(candidate,item)))return true;
  const children=current.filter(item=>!item.parentId&&containsRing(candidate,item.points));
  if(!children.length)return false;
  const covered={...candidate,subzones:{...candidate.subzones,...Object.fromEntries(children.map((item,index)=>['covered'+index,item.points]))}};
  return netArea(covered)<=Math.max(1e-6,netArea(candidate)*1e-8);
}
function integrateCandidate(items,candidate) {
  const current=items.filter(i=>i.page===candidate.page&&i.kind==='area');
  if(candidateAlreadyMeasured(candidate,items))return {ok:false,reason:'déjà mesurée'};
  let parent=null;const children=[];
  for(const existing of current) {
    if(!overlapItems(candidate,existing))continue;
    if(containsRing(existing,candidate.points)) {
      if(parent)return {ok:false,reason:'chevauchement de plusieurs relevés'};
      parent=existing;
    }else if(containsRing(candidate,existing.points)&&!existing.parentId)children.push(existing);
    else return {ok:false,reason:'chevauchement partiel : corrigez les contours'};
  }
  if(parent&&children.length)return {ok:false,reason:'imbrication à corriger'};
  if(parent) {
    parent.subzones={...parent.subzones,[candidate.id]:structuredClone(candidate.points)};
    parent.qty=netArea(parent)*S.scales[parent.page]**2;parent.status='à valider';candidate.parentId=parent.id;
  }
  if(children.length) {
    candidate.subzones={...candidate.subzones};
    for(const child of children){candidate.subzones[child.id]=structuredClone(child.points);child.parentId=candidate.id;}
  }
  candidate.qty=netArea(candidate)*S.scales[candidate.page]**2;
  return {ok:true,item:candidate};
}
function addDetected(candidates) {
  const chosen=candidates.filter(i=>i.selected&&!i.mixedBathroom&&!i.needsSeparation),items=structuredClone(S.items),accepted=[],skipped=[];
  for(const source of chosen) {
    const candidate={...structuredClone(source),id:uid(),page:S.page,status:'à valider',waste:mat(source.material).waste};
    delete candidate.selected;delete candidate.mixedBathroom;
    const result=integrateCandidate(items,candidate);
    if(result.ok){items.push(candidate);accepted.push(candidate.id);}else skipped.push({name:source.name,reason:result.reason});
  }
  if(accepted.length){remember();S.items=items;setSelection(accepted);save();}
  S.preview=null;S.tool='select';refresh();return {accepted:accepted.length,skipped};
}
async function detectRoom(point) {
  if(!S.plan||!S.scale)return toast('Ouvrez et calibrez la feuille avant la détection.');
  const key=S.documentKey,page=S.page,image=S.plan;toast('Recherche du contour intérieur…');
  await new Promise(resolve=>setTimeout(resolve,0));
  try {
    const model=detectorForPage();if(key!==S.documentKey||page!==S.page||image!==S.plan)return;
    const room=componentAt(model,point,model.factor,4);
    if(!room)return toast('Contour fermé introuvable. Fermez le passage avec B, ou tracez la surface avec S.');
    const candidate=roomCandidate(model,room,S.pageInfo[S.page],S.material,S.settings,S.scale);
    if(!candidate)return toast('Le contour ne peut pas être mesuré. Utilisez le tracé polygonal.');
    if(candidate.needsSeparation){S.preview={page:S.page,items:[candidate]};return detectionResults([candidate]);}
    const result=addDetected([candidate]);
    toast(result.accepted?`Pièce ajoutée · contour à valider.`:result.skipped[0]?.reason||'Aucune pièce ajoutée.');
  }catch(error){toast('Détection indisponible : '+error.message);}
}
function analyzeAll() { return openDetectionSettings(); }
function detectionResults(candidates) {
  S.reviewByPage[S.page]={key:S.documentKey,items:candidates.map(item=>({...item,page:S.page}))};
  closeDialog();S.reviewOpen=true;renderDetectionPanel();refreshWorkflow();
}
function finishArea(points,method='Tracé polygonal') {
  if(!S.scale)return toast('Calibrez d’abord le plan.');
  if(!validPolygon(points))return toast('Tracez au moins trois coins sans croisement.');
  const target=actionableSurface(),parent=target?.item;
  if(['split','exclude'].includes(S.tool)&&(!parent||!containsRing(parent,points)))return toast('La sous-zone doit rester entièrement à l’intérieur de la surface sélectionnée, sans croiser une exclusion.');
  if(S.tool==='exclude') {
    remember();parent.holes=[...(parent.holes||[]),structuredClone(points)];parent.qty=netArea(parent)*S.scale*S.scale;parent.status='à valider';if(target.preview){parent.geometryEdited=true;parent.method='Contour détecté corrigé';}S.draft=[];S.tool='select';save();refresh();return;
  }
  const material=mat(S.material),item={id:uid(),kind:'area',name:'Zone '+(S.items.filter(i=>i.kind==='area').length+1),material:material.code,
    points:structuredClone(points),holes:[],qty:area(points)*S.scale*S.scale,waste:material.waste,page:S.page,status:'à valider',method:S.tool==='split'?'Sous-zone retranchée':method};
  const items=structuredClone(S.items),result=integrateCandidate(items,item);
  if(!result.ok)return toast(result.reason+'. Modifiez la surface avant de l’ajouter.');
  remember();S.items=[...items,item];setSelection([item.id]);S.draft=[];S.tool='select';save();refresh();
}
function deleteSelection() {
  const preview=S.reviewOpen&&S.previewFocus!==null?S.reviewByPage[S.page]?.items[S.previewFocus]:null;
  if(preview&&!preview.duplicate) {
    remember();S.reviewByPage[S.page].items.splice(S.previewFocus,1);S.previewFocus=null;S.draft=[];S.tool='select';save();refresh();toast('Proposition retirée. Ctrl+Z pour la restaurer.');return;
  }
  const ids=new Set(S.items.filter(i=>i.page===S.page&&S.selection.has(i.id)).map(i=>i.id));if(!ids.size)return;
  remember();S.items=S.items.filter(i=>!ids.has(i.id)).map(item=>{
    const copy={...item,subzones:{...item.subzones}};
    for(const id of ids)if(Object.hasOwn(copy.subzones,id)){delete copy.subzones[id];copy.status='à valider';}
    if(ids.has(copy.parentId))delete copy.parentId;
    if(copy.kind==='area')copy.qty=netArea(copy)*S.scales[copy.page]**2;
    return copy;
  });
  setSelection([]);save();refresh();toast(ids.size+' mesure(s) supprimée(s). Ctrl+Z pour annuler.');
}
function updateItem(id,patch) {
  const item=S.items.find(i=>i.id===id);if(!item)return;
  if((item.kind==='count'||item.measureOnly)&&'waste'in patch)patch={...patch,waste:0};
  if('waste'in patch&&(!Number.isFinite(patch.waste)||patch.waste<0||patch.waste>1000))return toast('Entrez une perte entre 0 et 1 000 %.');
  if('material'in patch)patch={...patch,materialNeedsReview:false};
  const changed=['material','waste','bathroom','points','holes'].some(key=>key in patch&&patch[key]!==item[key]);
  const future={...item,...patch};
  if(patch.status==='confirmée'&&confirmationIssues(future).length)return toast('Confirmation impossible : '+confirmationIssues(future).join(' · ')+'.');
  remember();Object.assign(item,patch);
  if(changed&&!('status'in patch))item.status='à valider';
  if(item.kind==='area'&&item.bathroom&&!item.fixtureScanDone)applyRecognizedFixtures(item,S.pageInfo[item.page]||{},S.scales[item.page]);
  if(hasPendingFixtures(item))item.status='à valider';save();refresh();
}
function recalculatePage(page) {
  const scale=S.scales[page];
  S.items=S.items.map(item=>{
    if(item.page!==page)return item;
    if(item.kind!=='count'&&(!Number.isFinite(scale)||scale<=0))return item;
    const qty=item.kind==='count'?item.points.length:item.kind==='area'?netArea(item)*scale*scale:lineLength(item.points)*scale;
    const changed=!Number.isFinite(item.qty)||Math.abs(qty-item.qty)>Math.max(1e-7,Math.abs(qty)*1e-9);
    return {...item,qty,status:changed?'à valider':item.status};
  });S.detectorCache=null;
}

function zoomAt(next,x=canvas.clientWidth/2,y=canvas.clientHeight/2) {
  if(!S.plan)return;
  next=Math.max(.02,Math.min(16,next));
  const world={x:(x-S.pan.x)/S.zoom,y:(y-S.pan.y)/S.zoom};
  S.zoom=next;S.pan={x:x-world.x*next,y:y-world.y*next};
  $('#zoomText').textContent=Math.round(next*100)+' %';
}
function fitPlan(image=S.plan) {
  if(!image)return;
  const w=canvas.clientWidth||800,h=canvas.clientHeight||600;
  S.zoom=Math.max(.02,Math.min(16,(w-40)/image.width,(h-40)/image.height));
  S.pan={x:(w-image.width*S.zoom)/2,y:(h-image.height*S.zoom)/2};
}
function zoomSelection() {
  const points=S.items.filter(i=>S.selection.has(i.id)&&i.page===S.page).flatMap(i=>i.points);
  if(!points.length)return fitPlan();
  const b=boundsOf(points),w=canvas.clientWidth,h=canvas.clientHeight;
  S.zoom=Math.max(.02,Math.min(16,(w-80)/Math.max(b.right-b.x,5),(h-80)/Math.max(b.bottom-b.y,5)));
  S.pan={x:(w-(b.right+b.x)*S.zoom)/2,y:(h-(b.bottom+b.y)*S.zoom)/2};
}
function activateTool(tool) {
  if(S.loading)return;
  S.fixtureDrawing=null;S.fixtureEditing=null;
  if(tool==='calibrate')return calibrationModal();
  if(tool==='tileOrigin')return activateOrigin();
  if(['rectangle','segment','dimension'].includes(tool)&&!S.scale)return calibrationModal();
  if(['split','exclude','edit'].includes(tool)) {
    const parent=actionableSurface()?.item;
    if(!parent)return toast('Sélectionnez une surface avant d’utiliser cet outil.');
    if(tool==='split'&&(parent.parentId||Object.keys(parent.subzones||{}).length))return toast('Cette surface contient des sous-zones liées. Découpez une surface indépendante pour conserver ces liens.');
    S.splitParent=parent.id;
  }
  S.tool=tool;S.draft=[];refresh();canvas.focus();
}
function openDialog(title,body,kind='') {
  if(!$('#overlay').innerHTML.trim())S.dialogReturnFocus=document.activeElement;
  $('#overlay').innerHTML=`<div class="modal-back"><section class="v4-dialog ${kind}" role="dialog" aria-modal="true" aria-labelledby="v4DialogTitle"><header><h2 id="v4DialogTitle">${esc(title)}</h2><button id="closeV4Dialog" type="button" aria-label="Fermer">×</button></header>${body}</section></div>`;
  $('#closeV4Dialog').onclick=closeDialog;$('#closeV4Dialog').focus();
}
function closeDialog() {if(S.detectJob)S.detectJob.cancelled=true;$('#overlay').innerHTML='';S.preview=null;S.fixturePreview=null;S.dialogReturnFocus?.focus?.();}
function helpDialog() {
  const rows=[
    ['Molette','Zoom centré sur le pointeur'],['Bouton central / Espace + glisser','Déplacer le plan'],
    ['V / H','Sélection / main'],['P / J / Q / D','Rectangle / segments / comptage / cote de référence'],['S / L','Surface / ligne de plinthe · Mural pour douche et dosseret'],['A','Détecter une pièce au clic'],
    ['Ctrl/Cmd + Maj + A','Détecter les pièces de la feuille'],['C','Échelle et calibration'],['B','Fermer un passage : 2 points'],
    ['R','Cadre de détection : 2 coins'],['E','Modifier les coins de la surface sélectionnée'],['F / X','Découper par une ligne / exclusion intérieure'],
    ['T','Choisir le départ de céramique sur le plan'],['Flèches dans l’outil T','Déplacer le départ de 1 po; Maj : 12 po'],
    ['O / Maj + O','Tourner la céramique de +90° / −90°'],['G','Afficher / masquer la trame'],
    ['+ / −','Zoomer / dézoomer'],['0 / Début','Afficher la feuille entière'],['1','Afficher à 100 %'],['Z','Cadrer la sélection'],
    ['Flèches','Déplacer la vue; Maj : déplacement plus grand'],['Page précédente / suivante','Changer de feuille (Page Up / Page Down)'],
    ['F2','Renommer la feuille'],['Ctrl/Cmd + clic','Ajouter / retirer de la sélection'],['Ctrl/Cmd + A','Tout sélectionner sur la feuille'],
    ['Suppr','Supprimer la sélection'],['Retour arrière / clic droit','Retirer le dernier point du tracé'],['Entrée / double-clic','Terminer le tracé'],
    ['Maj pendant un tracé','Aligner horizontalement ou verticalement'],['Échap','Annuler l’outil ou fermer la fenêtre'],
    ['Double-clic / F6 / Entrée','Modifier une surface ou une ligne sélectionnée'],['F4 / F5','Estimation et commandes / fiche de pose sélectionnée'],['Ctrl/Cmd + Z / Y','Annuler / rétablir'],['Ctrl/Cmd + O','Ouvrir un plan'],['Ctrl/Cmd + S','Sauvegarder le relevé dans un fichier'],
    ['Ctrl/Cmd + I','Restaurer un relevé sauvegardé'],['Ctrl/Cmd + E','Exporter les quantités en Excel'],['? / F1','Afficher cette aide']
  ];
  openDialog('Souris et raccourcis clavier',`<p>Les raccourcis du logiciel sont suspendus pendant la saisie dans les champs.</p><div class="shortcut-list">${rows.map(([key,description])=>`<div><kbd>${esc(key)}</kbd><span>${esc(description)}</span></div>`).join('')}</div>`,'wide');
}
function keyboard(event) {
  const key=event.key.toLowerCase(),modifier=event.ctrlKey||event.metaKey,overlay=$('#overlay');
  if(overlay.innerHTML.trim()) {
    if(key==='escape'){event.preventDefault();$('.scale-modal',overlay)?closeCalibration():closeDialog();}
    if(key==='tab') {
      const controls=$$('button:not(:disabled),input:not(:disabled),select:not(:disabled)',overlay).filter(el=>!el.closest('[hidden]')&&!el.closest('fieldset:disabled')&&el.tabIndex!==-1);
      if(controls.length&&event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1).focus();}
      else if(controls.length&&!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0].focus();}
    }
    return;
  }
  if(event.target.closest?.('input,select,textarea,[contenteditable="true"],[contenteditable=""]'))return;
  if(event.target.closest?.('button')&&(key==='enter'||key===' '))return;
  if(S.dragging){if(key==='escape'){event.preventDefault();const before=S.dragging.before;S.dragging=null;restoreSnapshot(before);S.dragged=true;}return;}
  if(S.loading)return;
  if(modifier) {
    const actions={o:()=>$('#fileInput').click(),s:exportProject,i:()=>$('#projectInput').click(),e:exportExcel,
      a:()=>{if(event.shiftKey)return analyzeAll();setSelection(S.items.filter(i=>i.page===S.page).map(i=>i.id));S.tool='select';S.draft=[];refresh();},
      z:()=>event.shiftKey?redoChange():undoChange(),y:redoChange};
    if(actions[key]){event.preventDefault();actions[key]();}return;
  }
  if(event.altKey)return;
  if(key==='f4'){event.preventDefault();estimateDialog();return;}
  if(key==='f6'){event.preventDefault();if(S.selected)openItemEditor(S.selected);return;}
  if(key==='f5'){event.preventDefault();if(S.selected)workDialog(S.selected);else toast('Sélectionnez une mesure pour ouvrir sa fiche.');return;}
  if(key==='?'||key==='f1'){event.preventDefault();helpDialog();return;}
  if(key==='delete'||key==='backspace') {
    event.preventDefault();if(S.draft.length){S.draft.pop();refresh();}else deleteSelection();return;
  }
  if(key==='escape'){event.preventDefault();if(S.reviewOpen)closeReview();S.fixtureDrawing=null;S.fixtureEditing=null;S.fixturePreview=null;S.draft=[];S.preview=null;setSelection([]);S.tool='select';refresh();return;}
  if(key==='enter') {
    if(finishManualTool()){event.preventDefault();return;}
    const row=event.target.closest?.('[data-item]');
    if(row)openItemEditor(row.dataset.item);
    else if(S.tool==='fixturePolygon'&&S.draft.length>=3)finishFixtureDrawing();
    else if(S.tool==='select'&&S.selected)openItemEditor(S.selected);
    else if(['area','split','exclude'].includes(S.tool)&&S.draft.length>=3)finishArea(S.draft);
    else if(S.tool==='linear'&&S.draft.length>=2)finishLine(S.draft);
    return;
  }
  if(key===' '){event.preventDefault();S.spaceHeld=true;canvas.style.cursor='grab';return;}
  if(['+','=','-','_','0','1','home','z'].includes(key)) {
    event.preventDefault();
    if(['+','='].includes(key))zoomAt(S.zoom*1.2);else if(['-','_'].includes(key))zoomAt(S.zoom/1.2);
    else if(key==='1')zoomAt(1);else if(key==='z')zoomSelection();else fitPlan();refresh();return;
  }
  if(key==='pageup'||key==='pagedown'){event.preventDefault();if(S.pdf)showPage(S.page+(key==='pageup'?-1:1));return;}
  if(key==='f2'){event.preventDefault();renameSheet();return;}
  if(key==='g'){event.preventDefault();S.tileGrid=!S.tileGrid;refresh();return;}
  if(key==='o'){event.preventDefault();rotateTile(event.shiftKey?-90:90);return;}
  if(key.startsWith('arrow')) {
    event.preventDefault();const dx=key==='arrowleft'?-1:key==='arrowright'?1:0,dy=key==='arrowup'?-1:key==='arrowdown'?1:0;
    if(S.tool==='tileOrigin') {
      const item=S.items.find(i=>i.id===S.selected);if(!item?.material.startsWith('CER')||!S.scale)return;
      const origin=tileLayout(item).origin,step=(event.shiftKey?12:1)/12/S.scale;
      setTileOrigin(item.id,{x:origin.x+dx*step,y:origin.y+dy*step});
    }else {const step=event.shiftKey?150:40;S.pan={x:S.pan.x-dx*step,y:S.pan.y-dy*step};}
    return;
  }
  const extra={q:'count',p:'rectangle',j:'segment',d:'dimension',h:'hand',b:'divider',r:'region',t:'tileOrigin',e:'edit',x:'exclude'},tool=extra[key]||TOOLS.find(t=>t[3].toLowerCase()===key)?.[0];
  if(tool){event.preventDefault();if(['count','rectangle','segment','dimension'].includes(tool))startManualTool(tool);else activateTool(tool);}
}
function snapPoint(point,event) {
  if(event.shiftKey&&S.draft.length) {
    const prior=S.draft.at(-1);return Math.abs(point.x-prior.x)>Math.abs(point.y-prior.y)?{x:point.x,y:prior.y}:{x:prior.x,y:point.y};
  }
  return point;
}
function drawGuides(context) {
  context.save();context.lineWidth=2/S.zoom;context.strokeStyle='#b73f24';context.setLineDash([6/S.zoom,4/S.zoom]);
  for(const divider of S.dividers[S.page]||[]){context.beginPath();divider.points.forEach((p,i)=>i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y));context.stroke();}
  const roi=S.detectBounds[S.page];if(roi){context.strokeStyle='#256d54';context.strokeRect(roi.x,roi.y,roi.right-roi.x,roi.bottom-roi.y);}
  if(S.preview?.page===S.page)for(const item of S.preview.items)if(!item.duplicate) {
    const focused=S.preview.items.indexOf(item)===S.previewFocus;
    context.save();
    if(item.selected||focused){context.save();clipItem(context,item);context.fillStyle=surfaceFillForItem(item);const b=boundsOf(item.points);context.fillRect(b.x,b.y,b.right-b.x,b.bottom-b.y);context.restore();}
    context.setLineDash(item.needsSeparation||!item.selected?[5/S.zoom,3/S.zoom]:[]);
    traceItem(context,item);context.strokeStyle=item.needsSeparation?'#b73f24':focused?'#101713':surfaceColorForItem(item);context.lineWidth=(focused?3:1.5)/S.zoom;context.stroke();context.restore();
  }
  if(S.draft.length&&S.mouseWorld&&!['count','rectangle','segment','dimension'].includes(S.tool)) {
    context.strokeStyle='#b73f24';context.beginPath();const p=S.draft.at(-1);context.moveTo(p.x,p.y);context.lineTo(S.mouseWorld.x,S.mouseWorld.y);context.stroke();
  }
  context.setLineDash([]);
  const editable=focusedSurfaceEdit();
  if(editable) {
    for(const p of editable.item.points){const r=4/S.zoom;context.fillStyle='#ffffff';context.fillRect(p.x-r,p.y-r,r*2,r*2);context.strokeStyle='#256d54';context.lineWidth=1.5/S.zoom;context.strokeRect(p.x-r,p.y-r,r*2,r*2);}
  }
  context.restore();
}
function finishTwoPointTool(point) {
  if(S.draft.length!==2)return;
  if(dist(...S.draft)<3){S.draft.pop();return toast('Choisissez deux points distincts.');}
  remember();
  if(S.tool==='divider')S.dividers[S.page]=[...(S.dividers[S.page]||[]),{id:uid(),points:structuredClone(S.draft)}];
  else if(S.tool==='region') {const b=boundsOf(S.draft);S.detectBounds[S.page]=b;S.tool='select';}
  S.draft=[];S.detectorCache=null;delete S.reviewByPage[S.page];save();refresh();
}
function validEditedItem(item) {
  if(!validPolygon(item.points))return false;
  if(!getHoles(item).every(hole=>hole.every(p=>inside(p,item.points)||onRing(p,item.points))&&!ringsCross(hole,item.points)))return false;
  const parent=S.items.find(i=>i.id===item.parentId);
  if(parent) {
    const copy={...parent,subzones:{...parent.subzones}};delete copy.subzones[item.id];
    if(!containsRing(copy,item.points))return false;
  }
  return !S.items.some(other=>other.id!==item.id&&other.page===item.page&&other.kind==='area'&&other.id!==item.parentId&&other.parentId!==item.id&&overlapItems(item,other));
}
function commitDrag(drag) {
  if(drag.type==='fixtureVertex')return commitFixtureDrag(drag);
  if(drag.type==='previewVertex') {
    const candidate=S.reviewByPage[S.page]?.items[drag.indexInReview];if(!candidate)return;
    if(!validPreviewEditedItem(candidate,drag.indexInReview)){restoreSnapshot(drag.before);toast('Ce déplacement croise un contour ou une exclusion. Proposition restaurée.');return;}
    candidate.qty=netArea(candidate)*S.scale**2;candidate.status='à valider';candidate.method='Contour détecté corrigé';candidate.geometryEdited=true;
    S.history.push(drag.before);S.history=S.history.slice(-40);S.redo=[];save();refresh();return;
  }
  const item=S.items.find(i=>i.id===drag.id);if(!item)return;
  if(drag.type==='vertex') {
    if(!validEditedItem(item)){restoreSnapshot(drag.before);toast('Ce déplacement croise un contour ou une exclusion. Modification annulée.');return;}
    item.qty=netArea(item)*S.scales[item.page]**2;item.status='à valider';
    const parent=S.items.find(i=>i.id===item.parentId);if(parent){parent.subzones[item.id]=structuredClone(item.points);parent.qty=netArea(parent)*S.scales[parent.page]**2;parent.status='à valider';}
  }
  S.history.push(drag.before);S.history=S.history.slice(-40);S.redo=[];save();refresh();
}
function focusedSurfaceEdit() {
  if(!['select','edit'].includes(S.tool)||S.draft.length)return null;
  return actionableSurface();
}
function actionableSurface() {
  if(S.reviewOpen&&S.previewFocus!==null) {
    const item=S.reviewByPage[S.page]?.items[S.previewFocus];
    if(item&&!item.duplicate)return {item,preview:true,index:S.previewFocus};
  }
  const item=S.selection.size===1?S.items.find(item=>item.id===S.selected&&item.page===S.page&&item.kind==='area'):null;
  return item?{item,preview:false}:null;
}
function hasDeletableSelection() {
  return !!(S.items.some(item=>item.page===S.page&&S.selection.has(item.id))||S.reviewOpen&&S.previewFocus!==null&&S.reviewByPage[S.page]?.items[S.previewFocus]&&!S.reviewByPage[S.page].items[S.previewFocus].duplicate);
}
function finishSurfaceSplit() {
  const target=actionableSurface();
  if(!target||S.draft.length!==2)return toast('Sélectionnez une surface, puis cliquez deux points pour définir la ligne de découpe.');
  const source=target.item;
  if(source.parentId||Object.keys(source.subzones||{}).length)return toast('Découpez une surface indépendante : les sous-zones liées doivent conserver leurs limites.');
  try {
    const pieces=splitSurfaceByLine(source,...S.draft);
    const items=pieces.map((piece,index)=>{
      const item={...structuredClone(source),...piece,id:uid(),name:source.name+' · '+(index+1),status:'à valider',method:'Découpe du contour',geometryEdited:true};
      delete item.fixtureCuts;delete item.subzones;delete item.parentId;
      if(source.fixturePending)item.fixturePending=source.fixturePending.filter(hint=>!Number.isFinite(hint.cx)||!Number.isFinite(hint.cy)||insideItem({x:hint.cx,y:hint.cy},item));
      item.qty=netArea(item)*S.scale**2;
      if(item.work?.baseboard?.enabled)item.work.baseboard.enabled=false;
      if(target.preview){delete item.id;item.selected=true;const labels=distinctRoomLabels((S.pageInfo[S.page]?.labels||[]).filter(label=>insideItem({x:label.cx,y:label.cy},item))),names=labels.map(label=>label.text),baths=names.filter(isBathroom),dwellings=names.filter(isDwellingName);item.mixedBathroom=!!baths.length&&names.some(name=>!isBathroom(name));item.needsSeparation=item.mixedBathroom||dwellings.length>1||new Set(names).size>1&&!names.every(isOpenLivingName)&&!names.every(name=>spaceTypeFromName(name)==='circulation')&&!(dwellings.length===1&&names.every(name=>isOpenLivingName(name)||isDwellingName(name)));item.selected=!item.needsSeparation;if(names.length){item.bathroom=!!baths.length&&!item.mixedBathroom;item.spaceType=item.bathroom?'bathroom':dwellings.length===1?'dwelling':spaceTypeFromName(names[0]);}}
      return item;
    });
    remember();
    if(target.preview){S.reviewByPage[S.page].items.splice(target.index,1,...items);S.previewFocus=target.index;setSelection([]);}
    else {S.items=S.items.flatMap(item=>item.id===source.id?items:[item]);setSelection(items.map(item=>item.id));}
    S.draft=[];S.tool='select';save();refresh();toast(items.length+' surfaces obtenues · superficie nette conservée · à valider.'+(source.work?.baseboard?.enabled?' Plinthes liées désactivées : vérifiez les nouveaux parcours.':''));
  }catch(error){S.draft=[];refresh();toast(error.message);}
}
function validPreviewEditedItem(item,index) {
  if(!validPolygon(item.points)||!getHoles(item).every(hole=>hole.every(point=>inside(point,item.points)||onRing(point,item.points))&&!ringsCross(hole,item.points)))return false;
  const proposals=S.reviewByPage[S.page]?.items||[];
  if(proposals.some((other,n)=>n!==index&&!other.duplicate&&other.selected&&overlapItems(item,other)))return false;
  return !S.items.some(other=>other.page===S.page&&other.kind==='area'&&overlapItems(item,other));
}
function selectSurfaceAt(point,event) {
  if(S.reviewOpen) {
    const candidates=S.reviewByPage[S.page]?.items||[];
    const index=candidates.findLastIndex(item=>!item.duplicate&&(insideItem(point,item)||item.points.some((p,n)=>distanceToSegment(point,p,item.points[(n+1)%item.points.length])<=8/S.zoom)));
    if(index>=0){setSelection([]);S.previewFocus=index;refresh();return;}
  }
  const hit=surfaceForEdit(point);
  if(hit)selectItem(hit.id,event);
  else if(!(event.ctrlKey||event.metaKey||event.shiftKey)){S.previewFocus=null;setSelection([]);refresh();}
}

function renderInspector() {
  renderInspectorBase();const host=$('#inspector'),item=S.items.find(i=>i.id===S.selected);
  if(S.selection.size===1&&item?.kind==='area') {
    host.insertAdjacentHTML('beforeend',`<section class="v4-properties"><label class="check-label"><input id="bathroomFlag" type="checkbox" ${item.bathroom?'checked':''}>Salle de bains · équipements</label><button type="button" id="editVertices" class="selection-action">Modifier les coins · E</button><button type="button" id="excludeInside" class="selection-action">Exclure une surface intérieure · X</button>${item.material.startsWith('CER')?`<h3>Départ de céramique</h3><p>Croix orange sur le plan · angle ${fmt(tileLayout(item).angle,0)}° · joint ${fmt(tileLayout(item).joint,3)} po</p><button type="button" id="placeTileOrigin" class="selection-action">Choisir le point de départ · T</button><button type="button" id="openTileSettings" class="selection-action">Format, angle et décalages</button><button type="button" id="rotateTiles" class="selection-action">Tourner de 90° · O</button><p>Dans l’outil T : flèches = 1 po, Maj + flèches = 12 po. La superficie mesurée reste identique.</p>`:''}${getHoles(item).length?`<p>${getHoles(item).length} exclusion(s) déjà retranchée(s) du net.</p>`:''}</section>`);
    if(item.bathroom)host.insertAdjacentHTML('beforeend','<p class="selection-help">Excluez le bain, la douche ou les meubles fixes avec X si leur surface ne reçoit pas le revêtement prévu.</p>');
    $('#bathroomFlag').onchange=event=>updateItem(item.id,{bathroom:event.target.checked,spaceType:event.target.checked?'bathroom':surfaceSpaceType(item)==='bathroom'?'room':surfaceSpaceType(item)});
    $('#editVertices').onclick=()=>activateTool('edit');$('#excludeInside').onclick=()=>activateTool('exclude');
    if($('#placeTileOrigin')){$('#placeTileOrigin').onclick=activateOrigin;$('#openTileSettings').onclick=tileModal;$('#rotateTiles').onclick=()=>rotateTile();}
  }else if(!S.selection.size) {
    host.insertAdjacentHTML('beforeend',`<section class="v4-properties"><h3>Détection et navigation</h3><p>Murs affiche les limites retenues. Détecter propose les contours. Fermer un passage sépare les pièces communicantes. Choisissez les finis selon le plan ou le devis.</p><p>Molette : zoom au pointeur<br>Espace + glisser : déplacer le plan<br>Clic sur une surface : sommets modifiables</p></section>`);
  }
  estimateInspector(host,item);appendSurfaceInspector(host,item);appendWallTakeoffInspector(host,item);renderFolderInspector(item);
  host.insertAdjacentHTML('afterbegin','<button type="button" class="inspector-close" id="closeInspector">Fermer les propriétés ×</button>');
  $('#closeInspector').onclick=()=>{host.hidden=true;$('#reopen').hidden=false;};
}
function refresh() {
  refreshBase();renderPages();$('#stageFile').textContent=S.plan?pageName(S.page):S.fileName;
  $('#stageFile').title=S.fileName;$('#fitView')?.setAttribute('title','Afficher toute la feuille · 0');
  const hints={fixtureBox:'Cliquez deux coins opposés autour du bain ou de la douche · Échap : annuler',fixturePolygon:'Cliquez le contour du bain ou de la douche · Entrée : retrancher · Échap : annuler',fixtureEdit:'Glissez les coins orange de l’emprise · Ctrl+Z : annuler · double-clic : propriétés',hand:'Glissez pour déplacer le plan · molette : zoom au pointeur',
    divider:'Cliquez les deux extrémités du passage à fermer · Maj : aligner · Ctrl+Z : annuler',
    region:'Cliquez deux coins autour du dessin à analyser',edit:'Glissez les carrés pour corriger le contour · Ctrl+Z : annuler',
    exclude:'Tracez une exclusion entièrement dans la surface sélectionnée, puis Entrée',
    tileOrigin:'Cliquez pour placer le départ · flèches : 1 po · Maj + flèches : 12 po · O : 90° · Échap : terminer',
    auto:'Cliquez dans une pièce · B ferme un passage · contours et finis à vérifier'};
  if(hints[S.tool]&&!S.loading)$('#hint').textContent=hints[S.tool];
  canvas.style.cursor=S.tool==='hand'?'grab':S.tool==='select'?'default':'crosshair';
  $('#toggleTileGrid').setAttribute('aria-pressed',String(S.tileGrid));
  $('#hint').hidden=true;
  refreshWorkflow();refreshManualUI();
}
function downloadBlob(blob,name) {
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function exportProject() {
  save();if(!S.plan)return toast('Ouvrez un plan avant de sauvegarder un relevé.');
  const data={format:'quantif-plancher',version:10,documentKey:S.documentKey,fileName:S.fileName,pages:S.pages,project:S.project,
    items:S.items,folders:S.folders||[],scales:S.scales,scaleMeta:S.scaleMeta,sheetNames:S.sheetNames,settings:S.settings,dividers:S.dividers,detectBounds:S.detectBounds,estimation:S.estimation};
  downloadBlob(new Blob([JSON.stringify(data)],{type:'application/json'}),S.project.replace(/[^a-z0-9_-]/gi,'_')+'.quantif.json');
  toast('Relevé sauvegardé. Le PDF devra être rouvert pour le restaurer.');
}
function validateProject(data) {
  if(data.format!=='quantif-plancher'||![4,5,6,7,8,9,10].includes(data.version)||!Array.isArray(data.items)||data.items.length>3000)throw new Error('Ce fichier n’est pas un relevé Quantif V4 à V10 valide.');
  if(data.documentKey!==S.documentKey||data.pages!==S.pages)throw new Error('Ouvrez le PDF ou l’image d’origine avant de restaurer ce relevé.');
  if(data.version>=5)validateEstimation(data.estimation);
  const points=(ring,min=2)=>Array.isArray(ring)&&ring.length>=min&&ring.length<=20000&&ring.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<100000&&Math.abs(p.y)<100000);
  const ids=new Set();
  for(const item of data.items) {
    const minPoints=item.kind==='count'?1:item.kind==='area'?3:2;
    if(!/^[a-z0-9_-]{1,60}$/i.test(item.id)||ids.has(item.id)||!Number.isInteger(item.page)||item.page<1||item.page>S.pages||!['area','linear','count'].includes(item.kind)||!points(item.points,minPoints)||
      !['confirmée','estimée','à valider'].includes(item.status)||!Number.isFinite(item.waste)||item.waste<0||item.waste>1000||
      typeof item.name!=='string'||item.name.length>300||typeof item.method!=='string'||item.method.length>300||
      !(item.kind==='count'?item.material==='QT-01':item.kind==='linear'?item.material==='PL-01':MATERIALS.some(material=>material.code===item.material)))throw new Error('Le relevé contient une mesure invalide.');
    if(item.measureOnly!==undefined&&(typeof item.measureOnly!=='boolean'||item.measureOnly&&item.kind!=='linear'))throw new Error('Une cote de référence doit être une ligne.');
    if(item.spaceType!==undefined&&!Object.hasOwn(SPACE_STYLES,item.spaceType))throw new Error('Le type d’espace est invalide.');
    if((item.kind==='count'||item.measureOnly)&&item.waste!==0)throw new Error('Les comptages et les cotes ne portent pas de perte.');
    if(item.kind==='count'&&(item.holes?.length||Object.keys(item.subzones||{}).length||item.layout||item.fixtureCuts!==undefined||item.fixturePending!==undefined||item.parentId))throw new Error('Un comptage ne porte pas d’exclusion ou de calepinage.');
    if(item.work)validateWork(item.work,item.kind);validateFixtureData(item);validateWallTakeoffData(item);ids.add(item.id);
    if((item.holes&&!Array.isArray(item.holes))||!getHoles(item).every(ring=>points(ring,3)))throw new Error('Une exclusion est invalide.');
    if(item.layout&&(!points([item.layout.origin,item.layout.origin])||!Number.isFinite(item.layout.angle)||!Number.isFinite(item.layout.joint)||item.layout.joint<0||item.layout.joint>1))throw new Error('Un départ de céramique est invalide.');
  }
  for(const [page,scale]of Object.entries(data.scales||{}))if(!/^\d+$/.test(page)||+page<1||+page>S.pages||!Number.isFinite(scale)||scale<=0)throw new Error('Une échelle est invalide.');
  for(const item of data.items)if(item.kind!=='count'&&!data.scales?.[item.page])throw new Error('L’échelle d’une mesure manque.');
  for(const [page,list]of Object.entries(data.dividers||{}))if(!/^\d+$/.test(page)||+page<1||+page>S.pages||!Array.isArray(list)||list.length>500||!list.every(divider=>points(divider.points)&&divider.points.length===2))throw new Error('Une séparation est invalide.');
  for(const rect of Object.values(data.detectBounds||{}))if(!['x','y','right','bottom'].every(key=>Number.isFinite(rect[key])))throw new Error('Un cadre est invalide.');
  validateFolders(data);return data;
}
async function importProject(file) {
  if(!file)return;
  try {
    if(!S.plan)throw new Error('Ouvrez d’abord le PDF ou l’image d’origine.');
    if(file.size>20000000)throw new Error('Le relevé dépasse 20 Mo.');
    const data=validateProject(JSON.parse(await file.text()));remember();
    S.items=data.items;S.folders=data.folders||[];S.scales=data.scales;S.scaleMeta=data.scaleMeta||{};S.sheetNames=data.sheetNames||{};
    S.dividers=data.dividers||{};S.detectBounds=data.detectBounds||{};S.estimation=data.version>=5?data.estimation:{catalog:{},group:'project'};
    if(data.settings&&[0,24,30,36,42,48].includes(data.settings.doorInches)&&['CER-01','CER-12X24'].includes(data.settings.bathroomMaterial)&&[135,180,215].includes(data.settings.threshold)&&data.settings.minArea>=1&&data.settings.minArea<=500)S.settings={surfaceDisplay:'spaces',surfaceLabels:true,...data.settings};
    S.project=String(data.project||S.project).slice(0,200);S.detectorCache=null;S.scale=S.scales[S.page]||null;
    for(let n=1;n<=S.pages;n++)recalculatePage(n);setSelection([]);save();refresh();toast('Relevé restauré. Les surfaces dont le calcul a changé sont à valider de nouveau.');
  }catch(error){toast('Restauration impossible : '+error.message);}
}

/* V5: one geometric source, explicit derived quantities and purchasing units. */
/* Sanitary footprints: identify only dimensioned, located objects; retain reviewable geometry. */
function fixtureTypeLabel(type) {return ({bath:'Bain',shower:'Douche','bath-shower':'Bain-douche'})[type]||'Équipement';}
function hasPendingFixtures(item) {return item.kind==='area'&&!!item.fixturePending?.length;}
function fixtureTextHints(texts=[]) {
  const sources=[...texts];
  for(const a of texts)if(/^(?:BAIN(?:[- /]DOUCHE)?|BAIGNOIRE|DOUCHE|TUB|SHOWER)\s*:?$/i.test(normalizeName(a.text))) {
    const near=texts.filter(b=>b!==a&&Math.abs(a.cy-b.cy)<Math.max(a.height,b.height)*.65&&b.x>=a.x+a.width-2&&b.x-a.x-a.width<Math.max(15,a.height*5)).sort((b,c)=>b.x-c.x)[0];
    if(near)sources.push({...a,text:a.text+' '+near.text,width:near.x+near.width-a.x,cx:(a.x+near.x+near.width)/2});
  }
  const hints=[];
  for(const t of sources) {
    const text=normalizeName(t.text).replace(/[″“”]/g,'"').replace(/[′‘’]/g,"'").replace(/''/g,'"');
    const kind=text.match(/^(BAIN(?:\s*[-/ ]\s*DOUCHE)?|BAIGNOIRE|DOUCHE|TUB|SHOWER)\b\s*:?\s*(.*)$/);if(!kind)continue;
    if(!kind[2]&&!/^(?:BAIN|BAIGNOIRE|DOUCHE|BAIN[- /]DOUCHE|TUB|SHOWER)$/.test(text))continue;
    const dimensions=kind[2].match(/^(\d+(?:[.,]\d+)?)\s*(MM|CM|PO|IN|["'])?\s*[X×]\s*(\d+(?:[.,]\d+)?)\s*(MM|CM|PO|IN|["'])?\s*$/);
    if(kind[2]&&!dimensions)continue; // Notes, instructions and mixed schedules are not equipment labels.
    const type=/BAIN.*DOUCHE/.test(kind[1])?'bath-shower':/DOUCHE|SHOWER/.test(kind[1])?'shower':'bath';
    const unit=dimensions?.[4]||dimensions?.[2]||'',factor=unit==='MM'?1/25.4:unit==='CM'?1/2.54:1;
    const widthInches=dimensions?Number(dimensions[1].replace(',','.'))*factor:null,lengthInches=dimensions?Number(dimensions[3].replace(',','.'))*factor:null;
    if(dimensions&&(!finiteRange(widthInches,12,144)||!finiteRange(lengthInches,12,144)))continue;
    const hint={key:type+':'+Math.round(t.cx*10)+':'+Math.round(t.cy*10),type,label:t.text,cx:t.cx,cy:t.cy,widthInches,lengthInches,assumedUnit:!!dimensions&&!unit};
    const prior=hints.findIndex(h=>h.type===type&&Math.hypot(h.cx-hint.cx,h.cy-hint.cy)<Math.max(18,t.height*3));
    if(prior<0)hints.push(hint);else if(!hints[prior].widthInches&&widthInches)hints[prior]=hint;
  }
  return hints;
}
function fixtureCollector(sheet,scaleInfo) {
  const scale=scaleInfo.candidates?.[0]?.feetPerInch/PDF_DPI;
  return {symbols:[],zones:[...fixtureTextHints(sheet.texts),...wallBacksplashHints(sheet.texts)].map(h=>{
    const radius=Math.max(70,Math.min(sheet.width*.22,(Math.max(h.widthInches||60,h.lengthInches||60)/12/(scale||.04))*1.2));
    return {x:h.cx-radius,y:h.cy-radius,right:h.cx+radius,bottom:h.cy+radius};
  })};
}
function keepFixturePath(collector,entry) {
  if(!collector?.zones?.length)return;
  let points=[];
  for(let i=0;i<entry.path.length;){const c=entry.path[i++],pairs=c===0||c===1?1:c===2?3:c===3?2:0;for(let j=0;j<pairs;j++)points.push({x:entry.path[i++],y:entry.path[i++]});}
  const b=boundsOf(points);
  if(collector.zones.some(z=>b.right>=z.x&&b.x<=z.right&&b.bottom>=z.y&&b.y<=z.bottom))collector.symbols.push(entry);
}
function symbolSegments(paths) {
  const out=[];
  for(const path of paths||[]) {
    let prior=null,start=null;
    const add=p=>{if(prior&&dist(prior,p)>.1)out.push({a:prior,b:p,width:path.width,brightness:path.brightness});prior=p;};
    for(let i=0;i<path.path.length;) {
      const c=path.path[i++];
      if(c===0){prior=start={x:path.path[i++],y:path.path[i++]};}
      else if(c===1)add({x:path.path[i++],y:path.path[i++]});
      else if(c===2||c===3) {
        const a=prior,b={x:path.path[i++],y:path.path[i++]},q=c===2?{x:path.path[i++],y:path.path[i++]}:null,d={x:path.path[i++],y:path.path[i++]};
        if(a)for(let n=1;n<=12;n++){const t=n/12,u=1-t;add(q?{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*q.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*q.y+t*t*t*d.y}:{x:u*u*a.x+2*u*t*b.x+t*t*d.x,y:u*u*a.y+2*u*t*b.y+t*t*d.y});}
      }else if(c===4&&start)add(start);
    }
  }
  return out;
}
function fixtureComponents(info) {
  if(info.fixtureComponentCache)return info.fixtureComponentCache;
  const nodes=[],buckets=new Map(),edges=new Set(),adj=[],tolerance=.25;
  const node=(p,group)=>{
    const x=Math.round(p.x/tolerance),y=Math.round(p.y/tolerance);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const id of buckets.get(group+':'+(x+dx)+':'+(y+dy))||[])if(dist(nodes[id],p)<=tolerance)return id;
    const id=nodes.length,key=group+':'+x+':'+y;nodes.push(p);adj.push([]);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(id);return id;
  };
  for(const s of symbolSegments(info.vectorFixtures)) {
    const group=Math.round(s.brightness/12)+':'+Math.round(s.width*5),a=node(s.a,group),b=node(s.b,group),key=Math.min(a,b)+':'+Math.max(a,b);
    if(a===b||edges.has(key))continue;edges.add(key);adj[a].push(b);adj[b].push(a);
  }
  // Faucet arms, leaders and short open strokes must not discard a closed fixture outline.
  const active=Uint8Array.from(adj,a=>a.length?1:0),degree=Int32Array.from(adj,a=>a.length),queue=[];
  for(let i=0;i<adj.length;i++)if(active[i]&&degree[i]<2)queue.push(i);
  for(let n=0;n<queue.length;n++){const id=queue[n];if(!active[id])continue;active[id]=0;for(const next of adj[id])if(active[next]&&--degree[next]===1)queue.push(next);}
  const seen=new Set(),components=[];
  for(let i=0;i<nodes.length;i++) {
    if(seen.has(i)||!active[i])continue;const todo=[i],ids=[];seen.add(i);
    while(todo.length){const id=todo.pop();ids.push(id);for(const next of adj[id])if(active[next]&&!seen.has(next)){seen.add(next);todo.push(next);}}
    if(ids.length<4)continue;
    const b=boundsOf(ids.map(id=>nodes[id]));if(b.right-b.x>3&&b.bottom-b.y>3)components.push(b);
  }
  info.fixtureComponentCache=components;return components;
}
function outerContains(item,ring) {return containsRing({points:item.points,holes:[],subzones:{},fixtureCuts:[]},ring);}
function ringsOverlap(a,b) {return overlapItems({points:a,holes:[]},{points:b,holes:[]});}
function rectangularFootprint(item,box,width,height,scale) {
  const b=boundsOf(item.points),x=(box.x+box.right-width)/2,y=(box.y+box.bottom-height)/2;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),cx=clamp(x,b.x+.01,b.right-width-.01),cy=clamp(y,b.y+.01,b.bottom-height-.01);
  const limit=Math.max(2,.15/scale),dx=[0,cx-x],dy=[0,cy-y];
  for(const p of item.points)for(const offset of [.01,-.01]){if(Math.abs(p.x+offset-x)<=limit)dx.push(p.x+offset-x);if(Math.abs(p.x+offset-x-width)<=limit)dx.push(p.x+offset-x-width);if(Math.abs(p.y+offset-y)<=limit)dy.push(p.y+offset-y);if(Math.abs(p.y+offset-y-height)<=limit)dy.push(p.y+offset-y-height);}
  const shifts=[...new Set(dx)].flatMap(a=>[...new Set(dy)].map(b=>[a,b])).filter(([a,b])=>Math.hypot(a,b)<=limit).sort((a,b)=>Math.hypot(...a)-Math.hypot(...b));
  for(const [a,b]of shifts) {
    const xx=x+a,yy=y+b;
    const ring=[{x:xx,y:yy},{x:xx+width,y:yy},{x:xx+width,y:yy+height},{x:xx,y:yy+height}];
    if(outerContains(item,ring))return ring;
  }
  return null;
}
function locateFixture(item,hint,info,scale) {
  if(!hint.widthInches||!hint.lengthInches||!scale)return null;
  const candidates=[];
  for(const box of fixtureComponents(info)) {
    if(hint.cx<box.x-1||hint.cx>box.right+1||hint.cy<box.y-1||hint.cy>box.bottom+1)continue;
    for(const [w,h]of [[hint.widthInches,hint.lengthInches],[hint.lengthInches,hint.widthInches]]) {
      const width=w/12/scale,height=h/12/scale,ex=Math.abs((box.right-box.x)/width-1),ey=Math.abs((box.bottom-box.y)/height-1);
      if(ex>.14||ey>.14)continue;
      const points=rectangularFootprint(item,box,width,height,scale);if(points)candidates.push({points,score:ex+ey});
    }
  }
  candidates.sort((a,b)=>a.score-b.score);
  if(!candidates.length)return null;
  return {id:uid(),type:hint.type,label:fixtureTypeLabel(hint.type)+' '+fmt(hint.widthInches,1)+' × '+fmt(hint.lengthInches,1)+' po',source:'plan',hintKey:hint.key,widthInches:hint.widthInches,lengthInches:hint.lengthInches,points:candidates[0].points};
}
function checkFixtureCut(item,cut,replaceId=null) {
  if(!validPolygon(cut.points)||!outerContains(item,cut.points))return {ok:false,reason:'L’emprise dépasse le contour intérieur de la pièce.'};
  const absorbed=[];
  for(const old of item.fixtureCuts||[])if(old.id!==replaceId&&ringsOverlap(cut.points,old.points)) {
    if(outerContains({points:old.points},cut.points))return {ok:false,already:true,reason:'Emprise déjà exclue.'};
    return {ok:false,reason:'Cette emprise chevauche un bain ou une douche déjà exclu.'};
  }
  for(const ring of Object.values(item.subzones||{}))if(ringsOverlap(cut.points,ring))return {ok:false,reason:'Cette emprise chevauche une sous-zone déjà mesurée.'};
  for(const ring of item.holes||[])if(ringsOverlap(cut.points,ring)) {
    if(outerContains({points:ring},cut.points))return {ok:false,already:true,reason:'Cette emprise est déjà dans une exclusion.'};
    if(outerContains({points:cut.points},ring))absorbed.push(ring);
    else return {ok:false,reason:'Cette emprise croise une exclusion : corrigez ses limites.'};
  }
  return {ok:true,absorbed};
}
function addFixtureToItem(item,cut) {
  const check=checkFixtureCut(item,cut);if(!check.ok)return check;
  item.holes=(item.holes||[]).filter(h=>!check.absorbed.includes(h));
  item.fixtureCuts=[...(item.fixtureCuts||[]),{...structuredClone(cut),absorbedHoles:structuredClone(check.absorbed)}];
  item.fixturePending=(item.fixturePending||[]).filter(h=>h.key!==cut.hintKey);return {ok:true};
}
function recognizeFixtures(item,info,scale) {
  if(!item.bathroom&&!isBathroom(item.name))return {hints:[],cuts:[],pending:[]};
  const hints=fixtureTextHints(info?.texts||[]).filter(h=>inside({x:h.cx,y:h.cy},item.points)||onRing({x:h.cx,y:h.cy},item.points));
  const cuts=[],pending=[];
  for(const hint of hints) {
    if((item.fixtureCuts||[]).some(c=>c.hintKey===hint.key))continue;
    const cut=locateFixture(item,hint,info,scale);
    if(!cut){pending.push({...hint,reason:hint.widthInches?'Contour non reconnu : délimitez l’emprise sur le plan.':'Dimensions absentes : délimitez l’emprise sur le plan.'});continue;}
    const check=checkFixtureCut(item,cut);
    if(check.already)continue;
    if(!check.ok){pending.push({...hint,reason:check.reason});continue;}
    cuts.push(cut);
  }
  return {hints,cuts,pending};
}
function applyRecognizedFixtures(item,info,scale) {
  const found=recognizeFixtures(item,info,scale),pending=[...found.pending];
  for(const cut of found.cuts){const result=addFixtureToItem(item,cut);if(!result.ok&&!result.already)pending.push({key:cut.hintKey,type:cut.type,label:cut.label,reason:result.reason});}
  item.fixturePending=pending;item.fixtureScanDone=true;item.qty=netArea(item)*scale*scale;return found;
}
function removeFixture(id,cutId) {
  const item=S.items.find(i=>i.id===id),cut=item?.fixtureCuts?.find(c=>c.id===cutId);if(!cut)return;
  remember();item.fixtureCuts=item.fixtureCuts.filter(c=>c.id!==cutId);item.holes=[...(item.holes||[]),...(cut.absorbedHoles||[])];
  item.qty=netArea(item)*S.scales[item.page]**2;item.status='à valider';save();refresh();
}
function commitFixture(id,cut,replaceId=null) {
  const item=S.items.find(i=>i.id===id&&i.page===S.page);if(!item)throw new Error('Sélectionnez une surface de cette feuille.');
  if(replaceId) {
    const copy=structuredClone(item),old=copy.fixtureCuts.find(c=>c.id===replaceId);if(!old)throw new Error('Cette exclusion n’existe plus.');
    copy.fixtureCuts=copy.fixtureCuts.filter(c=>c.id!==replaceId);copy.holes.push(...(old.absorbedHoles||[]));
    const result=addFixtureToItem(copy,{...cut,id:replaceId});if(!result.ok)throw new Error(result.reason);
    remember();Object.assign(item,copy);
  }else {const copy=structuredClone(item),result=addFixtureToItem(copy,cut);if(!result.ok)throw new Error(result.reason);remember();Object.assign(item,copy);}
  item.status='à valider';item.fixtureScanDone=true;item.qty=netArea(item)*S.scales[item.page]**2;S.fixtureDrawing=null;S.draft=[];S.tool='select';save();refresh();
}
function validateFixtureData(item) {
  if(item.fixtureCuts===undefined&&item.fixturePending===undefined)return;
  if(item.kind!=='area'||item.fixtureCuts!==undefined&&(!Array.isArray(item.fixtureCuts)||item.fixtureCuts.length>100)||item.fixturePending!==undefined&&(!Array.isArray(item.fixturePending)||item.fixturePending.length>100))throw new Error('Exclusions sanitaires invalides.');
  const base={...item,fixtureCuts:[]},ids=new Set();
  for(const cut of item.fixtureCuts||[]) {
    if(!cut||typeof cut.id!=='string'||!/^[a-z0-9_-]{1,60}$/i.test(cut.id)||ids.has(cut.id)||!['bath','shower','bath-shower'].includes(cut.type)||!['plan','manual'].includes(cut.source)||typeof cut.label!=='string'||cut.label.length>200||!Array.isArray(cut.points)||cut.points.length>20000||!validPolygon(cut.points))throw new Error('Une emprise de bain/douche est invalide.');
    if(cut.hintKey!==undefined&&(typeof cut.hintKey!=='string'||cut.hintKey.length>120))throw new Error('Référence sanitaire invalide.');
    if(cut.widthInches!==undefined&&(!finiteRange(cut.widthInches,.01,1200)||!finiteRange(cut.lengthInches,.01,1200)))throw new Error('Cotes sanitaires invalides.');
    if(cut.absorbedHoles!==undefined&&(!Array.isArray(cut.absorbedHoles)||!cut.absorbedHoles.every(r=>Array.isArray(r)&&r.length<=20000&&validPolygon(r)&&outerContains({points:cut.points},r))))throw new Error('Exclusion sanitaire remplacée invalide.');
    const result=checkFixtureCut(base,cut);if(!result.ok)throw new Error(result.reason);ids.add(cut.id);base.fixtureCuts.push(cut);
  }
  for(const h of item.fixturePending||[])if(!h||typeof h.key!=='string'||h.key.length>120||typeof h.label!=='string'||h.label.length>200||!['bath','shower','bath-shower'].includes(h.type))throw new Error('Équipement à délimiter invalide.');
}
function simplifyRoomRing(ring,factor=1) {
  if(ring.length<=8)return ring;
  const tolerance=.8/factor;
  const simplify=points=>{const keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;const todo=[[0,points.length-1]];while(todo.length){const [a,b]=todo.pop();let max=tolerance,index=-1;for(let i=a+1;i<b;i++){const d=distanceToSegment(points[i],points[a],points[b]);if(d>max){max=d;index=i;}}if(index>=0){keep[index]=1;todo.push([a,index],[index,b]);}}return points.filter((p,i)=>keep[i]);};
  let split=1;for(let i=2;i<ring.length;i++)if(dist(ring[0],ring[i])>dist(ring[0],ring[split]))split=i;
  const pts=[...simplify(ring.slice(0,split+1)).slice(0,-1),...simplify([...ring.slice(split),ring[0]]).slice(0,-1)];
  return validPolygon(pts)&&Math.abs(area(pts)-area(ring))<=Math.max(1,area(ring)*.003)?pts:ring;
}
function simplifyRoomRings(rings,factor) {
  if(!rings.length)return rings;const proposed=rings.map(r=>simplifyRoomRing(r,factor)),outer={points:proposed[0]};
  if(!proposed.slice(1).every(r=>outerContains(outer,r)))return rings;
  for(let i=1;i<proposed.length;i++)for(let j=i+1;j<proposed.length;j++)if(ringsOverlap(proposed[i],proposed[j]))return rings;
  return proposed;
}

function surfaceForEdit(point) {
  return hitItem(point)||[...S.items].reverse().find(i=>i.page===S.page&&i.kind==='area'&&(inside(point,i.points)||i.points.some((p,n)=>distanceToSegment(point,p,i.points[(n+1)%i.points.length])<=8/S.zoom)));
}
function openItemEditor(id) {
  const item=S.items.find(i=>i.id===id&&i.page===S.page);if(!item||S.loading)return;
  setSelection([id]);S.tool='select';S.draft=[];S.fixtureDrawing=null;S.fixtureEditing=null;$('#inspector').hidden=false;$('#reopen').hidden=true;refresh();
  if(item.kind==='area')surfaceEditor(id);else workDialog(id);
}
function bindMeasureRowEvents() {
  $$('[data-item]').forEach(row=>{
    row.title='Double-clic ou Entrée : modifier cette mesure';
    row.onclick=event=>{S.lastMeasureClick={id:row.dataset.item,x:event.clientX,y:event.clientY,time:Date.now()};if(event.detail<2||!event.detail)selectItem(row.dataset.item,event);};
  });
  const edit=event=>{
    event.preventDefault();const row=event.target.closest?.('[data-item]'),last=S.lastMeasureClick;
    const id=row?.dataset.item||(last&&Date.now()-last.time<600&&Math.hypot(event.clientX-last.x,event.clientY-last.y)<7?last.id:null);
    if(id)openItemEditor(id);
  };
  $('#gridRows').ondblclick=edit;$('#measureTree').ondblclick=edit;
}
function fixtureSummary(item) {
  const scale=S.scales[item.page],gross=area(item.points)*scale*scale,net=netArea(item)*scale*scale;
  return {gross,net,excluded:gross-net,fixtures:(item.fixtureCuts||[]).reduce((s,c)=>s+area(c.points)*scale*scale,0)};
}
function surfaceEditor(id) {
  const item=S.items.find(i=>i.id===id&&i.kind==='area'&&i.page===S.page);if(!item)return;
  const q=fixtureSummary(item),bathroom=item.bathroom||isBathroom(item.name),cuts=item.fixtureCuts||[],pending=item.fixturePending||[];
  openDialog('Modifier la surface',`<form id="surfaceEditForm"><p><b>${esc(item.name)}</b> · ${esc(pageName(item.page))}</p><div class="v4-fields"><label>Nom de la pièce<input id="surfaceName" maxlength="300" required value="${esc(item.name)}"></label><label>Fini<select id="surfaceMaterial">${MATERIALS.map(m=>`<option value="${m.code}" ${m.code===item.material?'selected':''}>${m.code} · ${esc(m.name)}</option>`).join('')}</select></label><label>Perte (%)<input id="surfaceWaste" type="number" min="0" max="1000" step="any" required value="${item.waste}"></label><label>Statut<select id="surfaceStatus">${['confirmée','estimée','à valider'].map(s=>`<option value="${s}" ${s===item.status?'selected':''}>${s}</option>`).join('')}</select></label></div><label class="v5-check"><input id="surfaceBathroom" type="checkbox" ${bathroom?'checked':''}> Salle de bains · repérer les équipements</label>
    <div class="v6-surface-numbers"><div><span>Contour brut</span><b>${fmt(q.gross,2)} pi²</b></div><div><span>Exclusions et sous-zones</span><b>− ${fmt(q.excluded,2)} pi²</b></div><div><span>${pending.length?'Net provisoire · à délimiter':'Surface nette à couvrir'}</span><b>${fmt(q.net,2)} pi²</b></div></div>
    <p id="surfaceEditError" class="v4-error" role="alert"></p><div class="modal-actions"><button type="button" id="surfaceCancel">Fermer</button><button type="submit" class="primary">Enregistrer les propriétés</button></div></form>
    <section class="v6-edit-section"><h3>Corriger la géométrie</h3><p>La surface se recalcule depuis les contours. Les actions ci-dessous ouvrent le plan ; enregistrez d’abord les propriétés modifiées.</p><div class="v6-action-row"><button type="button" id="surfaceEditOutline">Modifier les coins du contour</button><button type="button" id="surfaceExcludeOther">Exclure une autre surface</button><button type="button" id="surfacePoseSheet">Ouvrir la fiche de pose · F5</button></div></section>
    <section class="v6-edit-section"><h3>Bains, bains-douches et douches à retirer du sol</h3><p>Leurs emprises sont retirées du revêtement au sol et des commandes. La céramique murale reste un poste séparé.</p><button type="button" id="surfaceAutoFixtures" class="selection-action">Repérer les bains et douches cotés dans cette pièce</button>
    ${pending.length?`<div class="v6-pending" role="status"><b>${pending.length} équipement(s) à délimiter</b><p>La quantité de commande de cette pièce reste à vérifier tant que ces emprises ne sont pas localisées.</p>${pending.map((h,n)=>`<div class="v6-fixture-row"><div><b>${esc(h.label)}</b><small>${esc(h.reason||'Emprise à délimiter sur le plan.')}</small></div><button type="button" id="pendingDraw${n}">Délimiter</button><button type="button" id="pendingIgnore${n}">Ignorer cette annotation</button></div>`).join('')}</div>`:''}
    ${cuts.length?cuts.map((c,n)=>`<div class="v6-fixture-row"><div><b>${esc(c.label)}</b><small>${fmt(area(c.points)*S.scales[item.page]**2,2)} pi² retranchés · ${c.source==='plan'?'cote et contour du plan':'contour saisi ou corrigé'}</small></div><button type="button" id="editFixture${n}">Corriger les coins</button><button type="button" id="removeFixture${n}">Supprimer l’exclusion</button></div>`).join(''):'<p>Aucune emprise sanitaire enregistrée. Utilisez le repérage des équipements cotés ou délimitez-les sur le plan.</p>'}
    <label>Forme à délimiter<select id="fixtureShape"><option value="box">Rectangle · deux coins opposés</option><option value="polygon">Contour libre · Entrée pour terminer</option></select></label><div class="v6-action-row"><button type="button" id="drawBath">Délimiter un bain</button><button type="button" id="drawBathShower">Délimiter un bain-douche</button><button type="button" id="drawShower">Délimiter une douche</button></div></section>
    ${(item.holes||[]).length?`<section class="v6-edit-section"><h3>Autres exclusions</h3>${item.holes.map((ring,n)=>`<div class="v6-fixture-row"><span>Exclusion ${n+1} · ${fmt(area(ring)*S.scales[item.page]**2,2)} pi²</span><button type="button" id="removeOtherHole${n}">Supprimer cette exclusion</button></div>`).join('')}</section>`:''}`,'wide');
  $('#surfaceCancel').onclick=closeDialog;
  $('#surfaceEditForm').onsubmit=event=>{event.preventDefault();try{
    const name=$('#surfaceName').value.trim(),waste=Number($('#surfaceWaste').value),bath=$('#surfaceBathroom').checked,material=$('#surfaceMaterial').value,status=$('#surfaceStatus').value;
    if(!name||name.length>300)throw new Error('Entrez un nom de pièce.');
    if(!finiteRange(waste,0,1000))throw new Error('Entrez une perte entre 0 et 1 000 %.');
    if(!MATERIALS.some(m=>m.code===material)||!['confirmée','estimée','à valider'].includes(status))throw new Error('Choisissez un fini et un statut valides.');
    if(status==='confirmée'&&confirmationIssues({...item,materialNeedsReview:false}).length)throw new Error('Confirmation impossible : '+confirmationIssues({...item,materialNeedsReview:false}).join(' · ')+'.');
    updateItem(id,{name,material,waste,status,bathroom:bath});closeDialog();toast('Propriétés enregistrées. La surface nette suit les contours.');
  }catch(error){$('#surfaceEditError').textContent=error.message;}};
  $('#surfaceEditOutline').onclick=()=>{closeDialog();activateTool('edit');};$('#surfaceExcludeOther').onclick=()=>{closeDialog();activateTool('exclude');};$('#surfacePoseSheet').onclick=()=>workDialog(id);
  $('#surfaceAutoFixtures').onclick=()=>fixtureDetectionDialog(id);
  const shape=()=>$('#fixtureShape').value;
  $('#drawBath').onclick=()=>startFixtureDraw(id,'bath',null,null,shape());$('#drawBathShower').onclick=()=>startFixtureDraw(id,'bath-shower',null,null,shape());$('#drawShower').onclick=()=>startFixtureDraw(id,'shower',null,null,shape());
  pending.forEach((hint,n)=>{
    $('#pendingDraw'+n).onclick=()=>startFixtureDraw(id,hint.type,hint.key,null,shape());
    $('#pendingIgnore'+n).onclick=()=>{remember();item.fixturePending=item.fixturePending.filter(h=>h.key!==hint.key);item.status='à valider';save();refresh();surfaceEditor(id);};
  });
  cuts.forEach((cut,n)=>{$('#editFixture'+n).onclick=()=>startFixtureEdit(id,cut.id);$('#removeFixture'+n).onclick=()=>{removeFixture(id,cut.id);surfaceEditor(id);};});
  (item.holes||[]).forEach((ring,n)=>$('#removeOtherHole'+n).onclick=()=>{remember();item.holes.splice(n,1);item.qty=netArea(item)*S.scales[item.page]**2;item.status='à valider';save();refresh();surfaceEditor(id);});
}
function fixtureDetectionDialog(id) {
  const item=S.items.find(i=>i.id===id&&i.page===S.page);if(!item)return;
  const source={page:S.page,key:S.documentKey,image:S.plan},found=recognizeFixtures({...item,bathroom:true},S.pageInfo[S.page]||{},S.scales[item.page]);
  S.fixturePreview={page:S.page,cuts:found.cuts};
  openDialog('Bains et douches de la pièce',`<p><b>${esc(item.name)}</b> · Les contours orange montrent les emprises proposées. Les cotes du plan définissent leur superficie ; chaque emplacement reste corrigeable.</p>${found.cuts.length?found.cuts.map(c=>`<div class="v6-fixture-row"><div><b>${esc(c.label)}</b><small>À retrancher : ${fmt(area(c.points)*S.scales[item.page]**2,2)} pi²</small></div></div>`).join(''):'<p>Aucune nouvelle emprise cotée et localisée à ajouter. Une emprise déjà exclue n’est pas retirée une deuxième fois.</p>'}${found.pending.length?`<div class="v6-pending"><b>À délimiter sur le plan</b>${found.pending.map(h=>`<p>${esc(h.label)} · ${esc(h.reason)}</p>`).join('')}</div>`:''}${!found.hints.length?'<p>Aucun équipement coté reconnu dans le texte. Pour un plan numérisé ou un symbole sans cote, délimitez le bain et la douche depuis la modification de la surface.</p>':''}<div class="modal-actions"><button type="button" id="cancelFixtureScan">Retour à la surface</button><button type="button" class="primary" id="applyFixtureScan">${found.cuts.length?'Appliquer '+found.cuts.length+' exclusion(s)':'Continuer la correction'}</button></div>`,'wide');
  $('#cancelFixtureScan').onclick=()=>{S.fixturePreview=null;surfaceEditor(id);};
  $('#applyFixtureScan').onclick=()=>{
    if(S.page!==source.page||S.documentKey!==source.key||S.plan!==source.image)return closeDialog();
    remember();item.bathroom=true;applyRecognizedFixtures(item,S.pageInfo[S.page]||{},S.scales[item.page]);item.status='à valider';S.fixturePreview=null;save();refresh();surfaceEditor(id);
  };
}
function startFixtureDraw(id,type,hintKey=null,replaceId=null,shape='box') {
  const item=S.items.find(i=>i.id===id&&i.page===S.page&&i.kind==='area');if(!item)return;
  closeDialog();setSelection([id]);S.dragged=false;S.fixtureEditing=null;S.fixtureDrawing={id,type,hintKey,replaceId};S.draft=[];S.tool=shape==='polygon'?'fixturePolygon':'fixtureBox';refresh();canvas.focus();
}
function finishFixtureDrawing() {
  if(!S.fixtureDrawing)return;
  let points=S.draft;
  if(S.tool==='fixtureBox') {if(points.length!==2)return;const b=boundsOf(points);points=[{x:b.x,y:b.y},{x:b.right,y:b.y},{x:b.right,y:b.bottom},{x:b.x,y:b.bottom}];}
  if(points.length<3)return;
  const d=S.fixtureDrawing,cut={id:uid(),type:d.type,label:fixtureTypeLabel(d.type)+' · emprise tracée',source:'manual',points:structuredClone(points),...(d.hintKey?{hintKey:d.hintKey}:{})};
  try{commitFixture(d.id,cut,d.replaceId);toast('Emprise retranchée du revêtement au sol.');}catch(error){if(S.tool==='fixtureBox')S.draft.pop();toast(error.message);}
}
function startFixtureEdit(id,cutId) {
  closeDialog();setSelection([id]);S.fixtureDrawing=null;S.fixtureEditing={id,cutId};S.draft=[];S.tool='fixtureEdit';refresh();canvas.focus();
}
function fixturePointerDown(event,point) {
  if(S.tool!=='fixtureEdit'||!S.fixtureEditing)return false;
  const item=S.items.find(i=>i.id===S.fixtureEditing.id),cut=item?.fixtureCuts?.find(c=>c.id===S.fixtureEditing.cutId);if(!cut)return false;
  const index=cut.points.findIndex(p=>dist(p,point)<=10/S.zoom);if(index<0)return false;
  S.dragging={type:'fixtureVertex',id:item.id,cutId:cut.id,index,before:snapshot(),start:point};canvas.setPointerCapture?.(event.pointerId);event.preventDefault();return true;
}
function commitFixtureDrag(drag) {
  const item=S.items.find(i=>i.id===drag.id),cut=item?.fixtureCuts?.find(c=>c.id===drag.cutId);if(!cut)return;
  const check=checkFixtureCut(item,cut,cut.id);
  if(!check.ok||(cut.absorbedHoles||[]).some(r=>!outerContains({points:cut.points},r))){restoreSnapshot(drag.before);return toast('Cette correction croise une limite ou une exclusion. Modification annulée.');}
  cut.source='manual';cut.label=fixtureTypeLabel(cut.type)+' · contour corrigé';delete cut.widthInches;delete cut.lengthInches;
  item.qty=netArea(item)*S.scales[item.page]**2;item.status='à valider';S.history.push(drag.before);S.history=S.history.slice(-40);S.redo=[];save();refresh();
}
function drawFixtureGuides(context) {
  context.save();context.strokeStyle='#b65335';context.fillStyle='#b653351f';context.lineWidth=2/S.zoom;context.setLineDash([5/S.zoom,3/S.zoom]);
  const draw=(cut,selected)=>{context.beginPath();traceRing(context,cut.points);context.fill();context.stroke();if(selected){const b=boundsOf(cut.points);context.save();context.setLineDash([]);context.font=`${12/S.zoom}px Arial`;context.textAlign='center';context.fillStyle='#873b23';context.fillText(fixtureTypeLabel(cut.type)+' − '+fmt(area(cut.points)*S.scale*S.scale,1)+' pi²',(b.x+b.right)/2,(b.y+b.bottom)/2);context.restore();}};
  for(const item of S.items.filter(i=>i.page===S.page))for(const cut of item.fixtureCuts||[])draw(cut,S.selected===item.id);
  if(S.fixturePreview?.page===S.page)for(const cut of S.fixturePreview.cuts)draw(cut,false);
  if(S.tool==='fixtureEdit'&&S.fixtureEditing){const item=S.items.find(i=>i.id===S.fixtureEditing.id),cut=item?.fixtureCuts?.find(c=>c.id===S.fixtureEditing.cutId);context.setLineDash([]);if(cut)for(const p of cut.points){const r=5/S.zoom;context.fillStyle='#fff';context.fillRect(p.x-r,p.y-r,r*2,r*2);context.strokeRect(p.x-r,p.y-r,r*2,r*2);}}
  if(S.tool==='fixtureBox'&&S.draft.length===1&&S.mouseWorld){const b=boundsOf([S.draft[0],S.mouseWorld]);context.strokeRect(b.x,b.y,b.right-b.x,b.bottom-b.y);}
  context.restore();
}
function appendSurfaceInspector(host,item) {
  if(S.selection.size!==1||item?.kind!=='area')return;
  const q=fixtureSummary(item);
  host.insertAdjacentHTML('beforeend',`<section class="v4-properties"><h3>Surface et exclusions · V6</h3><p>Contour brut : ${fmt(q.gross,2)} pi²<br>Exclusions : ${fmt(q.excluded,2)} pi²${hasPendingFixtures(item)?'<br><b>Bain/douche à délimiter avant commande.</b>':''}</p><button type="button" id="surfacePropertiesBtn" class="selection-action">Modifier la surface · double-clic</button>${item.bathroom||isBathroom(item.name)?'<button type="button" id="bathFixturesBtn" class="selection-action">Retirer bains et douches de la céramique</button>':''}</section>`);
  $('#surfacePropertiesBtn').onclick=()=>openItemEditor(item.id);if(item.bathroom||isBathroom(item.name))$('#bathFixturesBtn').onclick=()=>surfaceEditor(item.id);
}
function fixtureExportSheets() {
  const rows=[['Page','Feuille','Pièce','Poste','Description','Surface brute (pi²)','Exclusions totales (pi²)','Emprise sanitaire (pi²)','Net au sol (pi²)','Source','Contrôle']];
  for(const item of S.items.filter(i=>i.kind==='area'&&(i.bathroom||isBathroom(i.name)||(i.fixtureCuts||[]).length))) {
    const q=fixtureSummary(item),r=n=>+n.toFixed(4);
    rows.push([item.page,pageName(item.page),item.name,'Revêtement au sol',item.material,r(q.gross),r(q.excluded),r(q.fixtures),hasPendingFixtures(item)?'À délimiter':r(q.net),'Contour intérieur',hasPendingFixtures(item)?'Bain/douche à délimiter':item.status]);
    for(const cut of item.fixtureCuts||[])rows.push([item.page,pageName(item.page),item.name,fixtureTypeLabel(cut.type),cut.label,'','',r(area(cut.points)*S.scales[item.page]**2),'',cut.source==='plan'?'Cote et contour du plan':'Emprise saisie ou corrigée','Déjà retranchée du net ; ne pas soustraire à nouveau']);
    for(const hint of item.fixturePending||[])rows.push([item.page,pageName(item.page),item.name,'À délimiter',hint.label,'','','','','Annotation du plan',hint.reason||'Localiser l’emprise avant commande']);
  }
  return [['SDB hors bains et douches',rows]];
}

function catalogDefaults() {
  const defs={};
  for(const m of MATERIALS)defs[m.code]={name:m.name,unit:'pi²',pack:'boîte',coverage:null,price:null,labor:null,components:[]};
  defs['QT-01']={name:'Éléments comptés',unit:'u',pack:'unité',coverage:1,price:null,labor:null,components:[]};
  defs['PL-01']={name:'Plinthe / moulure manuelle',unit:'pi',pack:'barre',coverage:null,price:null,labor:null,components:[]};
  for(const m of MATERIALS)defs['PL-'+m.code]={...defs['PL-01'],name:'Plinthe associée · '+m.code,components:[]};
  defs['MUR-01']={...defs['CER-01'],name:'Céramique murale / dosseret',components:[]};
  return defs;
}
function profile(code) { return {...catalogDefaults()[code],...(S.estimation?.catalog?.[code]||{})}; }
function workOf(item) {
  const w=item.work||{};
  return {included:!item.measureOnly&&w.included!==false,block:w.block||'',level:w.level||'',unit:w.unit||'',type:w.type||'',repeat:w.repeat||1,
    lineRole:w.lineRole||'baseboard',baseboard:{enabled:false,code:item.kind==='area'?'PL-'+item.material:'PL-01',deductions:0,waste:5,...w.baseboard},
    wall:{height:48,openings:0,waste:10,...w.wall}};
}
function finiteRange(n,min,max) { return typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max; }
function validateWork(w,kind) {
  if(!w||typeof w!=='object'||Array.isArray(w)||typeof w.included!=='boolean'||!Number.isInteger(w.repeat)||w.repeat<1||w.repeat>999)throw new Error('Répétitions : entrez un entier de 1 à 999.');
  for(const k of ['block','level','unit','type'])if(typeof w[k]!=='string'||w[k].length>80)throw new Error('Bloc, étage, unité et type : 80 caractères maximum.');
  if(!['baseboard','wall'].includes(w.lineRole))throw new Error('Type de ligne invalide.');
  const b=w.baseboard,t=w.wall;
  if(!b||typeof b.enabled!=='boolean'||!Object.hasOwn(catalogDefaults(),b.code)||!b.code.startsWith('PL-')||!finiteRange(b.deductions,0,100000)||!finiteRange(b.waste,0,1000))throw new Error('Paramètres de plinthe invalides.');
  if(!t||!(t.height===null&&kind==='linear'&&w.lineRole==='wall'||finiteRange(t.height,0.01,1200))||!finiteRange(t.openings,0,1000000)||!finiteRange(t.waste,0,1000))throw new Error('Hauteur, ouvertures ou perte murale invalides.');
  return w;
}
function validateEstimation(value) {
  if(!value||typeof value!=='object'||Array.isArray(value)||!['project','floor'].includes(value.group)||!value.catalog||typeof value.catalog!=='object'||Array.isArray(value.catalog))throw new Error('Catalogue d’assemblages invalide.');
  const defs=catalogDefaults();
  for(const [code,p]of Object.entries(value.catalog)) {
    if(!Object.hasOwn(defs,code)||!p||typeof p!=='object'||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||p.unit!==defs[code].unit||typeof p.pack!=='string'||!p.pack.trim()||p.pack.length>30)throw new Error('Référence ou unité de catalogue invalide.');
    for(const k of ['coverage','price','labor'])if(p[k]!==null&&!finiteRange(p[k],k==='coverage'?0.000001:0,1e9))throw new Error('Rendement ou prix invalide.');
    if(!Array.isArray(p.components)||p.components.length>3||(p.unit!=='pi²'&&p.components.length))throw new Error('Trois consommables au maximum par surface.');
    for(const c of p.components) {
      if(!c||typeof c.name!=='string'||!c.name.trim()||c.name.length>120||typeof c.pack!=='string'||!c.pack.trim()||c.pack.length>30||!finiteRange(c.waste,0,1000))throw new Error('Consommable invalide.');
      for(const k of ['coverage','price'])if(c[k]!==null&&!finiteRange(c[k],k==='coverage'?0.000001:0,1e9))throw new Error('Rendement ou prix du consommable invalide.');
    }
  }
  return value;
}
function setWork(id,value) {
  const item=S.items.find(i=>i.id===id);if(!item)throw new Error('Cette mesure n’existe plus.');
  validateWork(value,item.kind);
  const scale=S.scales[item.page],q=lineLength(item.points)*scale;
  if(item.kind==='area'&&value.baseboard.enabled&&value.baseboard.deductions>perimeter(item.points)*scale+1e-7)throw new Error('Les longueurs exclues dépassent le périmètre extérieur.');
  if(item.kind==='linear'&&value.lineRole==='wall'&&value.wall.height!==null&&value.wall.openings>q*value.wall.height/12+1e-7)throw new Error('Les ouvertures dépassent la surface brute du mur.');
  const previous=workOf(item),changed=item.kind==='linear'&&(previous.lineRole!==value.lineRole||value.lineRole==='wall'&&(previous.wall.height!==value.wall.height||previous.wall.openings!==value.wall.openings));
  remember();item.work=structuredClone(value);if(changed)item.status='à valider';save();refresh();
}
function setProfile(code,value) {
  validateEstimation({group:'project',catalog:{[code]:value}});
  remember();S.estimation.catalog[code]=structuredClone(value);save();refresh();
}
function measureForEstimate(item) {
  if(item.kind==='count')return item.points.length;
  const scale=S.scales[item.page];
  if(!Number.isFinite(scale)||scale<=0||hasPendingFixtures(item))return null;
  return item.kind==='area'?Math.max(0,netArea(item))*scale*scale:lineLength(item.points)*scale;
}
function estimateLines() {
  const result=[];
  for(const item of S.items) {
    const w=workOf(item);if(item.measureOnly||!w.included||!isConfirmed(item))continue;
    const measured=measureForEstimate(item),scale=S.scales[item.page],issues=[];
    if(measured===null)issues.push(hasPendingFixtures(item)?'Bain/douche à délimiter':'Échelle manquante');
    else if(item.kind!=='count'&&!S.scaleMeta[item.page]?.verified)issues.push('Échelle à vérifier');
    if(item.status!=='confirmée')issues.push('Mesure '+item.status);
    if(w.repeat>1)issues.push('Répétition ×'+w.repeat+' à confirmer');
    const emit=(category,code,base,waste,extra=[])=>result.push({id:item.id,page:item.page,name:item.name,category,code,
      block:w.block,level:w.level,unit:w.unit,type:w.type,repeat:w.repeat,measured:base,net:base===null?null:base*w.repeat,
      waste,demand:base===null?null:base*w.repeat*(1+waste/100),issues:[...issues,...extra]});
    if(item.kind==='area') {
      emit('Sol',item.material,measured,item.waste);
      if(w.baseboard.enabled) {
        const outer=measured===null?null:perimeter(item.points)*scale,extra=[];
        if(outer!==null&&w.baseboard.deductions>outer+1e-7)extra.push('Exclusions de plinthe supérieures au périmètre');
        if(item.parentId||Object.keys(item.subzones||{}).length)extra.push('Sous-zone : limites de plinthe à vérifier');
        if(S.items.some(i=>i.kind==='linear'&&i.page===item.page&&i.name.trim().toLowerCase()===item.name.trim().toLowerCase()&&workOf(i).lineRole!=='wall'&&workOf(i).included))extra.push('Ligne manuelle de même nom : doublon possible');
        emit('Plinthe liée',w.baseboard.code,outer===null||w.baseboard.deductions>outer+1e-7?null:Math.max(0,outer-w.baseboard.deductions),w.baseboard.waste,extra);
      }
    } else if(item.kind==='count')emit('Comptage','QT-01',measured,0);
    else if(w.lineRole==='wall') {
      const gross=measured===null||!finiteRange(w.wall.height,.01,1200)?null:measured*w.wall.height/12;
      emit('Mur / dosseret','MUR-01',gross===null||w.wall.openings>gross+1e-7?null:Math.max(0,gross-w.wall.openings),w.wall.waste,
        gross!==null&&w.wall.openings>gross+1e-7?['Ouvertures supérieures à la surface brute']:[]);
    } else emit('Plinthe manuelle','PL-01',measured,item.waste);
  }
  return result;
}
function orderGroup(line,group=S.estimation.group) { return group==='floor'?JSON.stringify([line.block,line.level]):'Projet'; }
function orderGroupLabel(key) { if(key==='Projet')return 'Projet entier';const [b,l]=JSON.parse(key);return (b||'Bloc non renseigné')+' · '+(l||'Étage non renseigné'); }
function purchaseRows(lines=estimateLines()) {
  const groups=new Map();
  const add=(line,code,p,category,net,demand,labor)=>{
    const group=orderGroup(line),key=JSON.stringify([group,code]);
    if(!groups.has(key))groups.set(key,{group,code,name:p.name,category,unit:profile(line.code).unit,pack:p.pack,coverage:p.coverage,
      price:p.price,laborRate:labor,net:0,demand:0,unknown:false,issues:new Set(),sources:new Set()});
    const row=groups.get(key);row.sources.add(line.id);
    if(net===null||demand===null)row.unknown=true;else {row.net+=net;row.demand+=demand;}
    for(const note of line.issues)row.issues.add(note);
  };
  for(const line of lines) {
    const p=profile(line.code);add(line,line.code,p,line.category,line.net,line.demand,p.labor);
    p.components.forEach((c,index)=>add(line,line.code+'-C'+(index+1),c,'Consommable',line.net,line.net===null?null:line.net*(1+c.waste/100),null));
  }
  return [...groups.values()].map(r=>{
    if(r.coverage===null)r.issues.add('Rendement à saisir');
    if(r.price===null)r.issues.add('Prix matière à saisir');
    if(r.category!=='Consommable'&&r.laborRate===null)r.issues.add('Prix de pose à saisir');
    const packs=r.unknown||r.coverage===null?null:Math.max(0,Math.ceil(r.demand/r.coverage-1e-10));
    const materialCost=packs===null||r.price===null?null:packs*r.price;
    const laborCost=r.category==='Consommable'?0:r.unknown||r.laborRate===null?null:r.net*r.laborRate;
    return {...r,net:r.unknown?null:r.net,demand:r.unknown?null:r.demand,packs,materialCost,laborCost,
      purchased:packs===null?null:packs*r.coverage,issues:[...r.issues],sources:[...r.sources]};
  }).sort((a,b)=>a.group.localeCompare(b.group)||a.code.localeCompare(b.code));
}
function estimateTotals(rows=purchaseRows(),lines=estimateLines()) {
  return {knownCost:rows.reduce((s,r)=>s+(r.materialCost??0)+(r.laborCost??0),0),incomplete:rows.some(r=>r.materialCost===null||r.laborCost===null),
    floor:lines.filter(l=>l.category==='Sol').reduce((s,l)=>s+(l.net??0),0),wall:lines.filter(l=>l.category==='Mur / dosseret').reduce((s,l)=>s+(l.net??0),0),
    linear:lines.filter(l=>l.category.startsWith('Plinthe')).reduce((s,l)=>s+(l.net??0),0),checks:rows.filter(r=>r.issues.length).length,
    floorUnknown:lines.some(l=>l.category==='Sol'&&l.net===null),wallUnknown:lines.some(l=>l.category==='Mur / dosseret'&&l.net===null),linearUnknown:lines.some(l=>l.category.startsWith('Plinthe')&&l.net===null)};
}
function estimationSheets() {
  const lines=estimateLines(),rows=purchaseRows(lines),v=n=>n===null?'À saisir / vérifier':Math.round(n*10000)/10000;
  const orders=[['Groupe de commande','Référence','Poste','Description','Net prévu','Unité de besoin','Besoin avec perte','Rendement / emballage','Emballage','Nombre entier','Quantité achetée','Prix / emballage','Coût matière','Pose / unité nette','Coût pose','Contrôles'],
    ...rows.map(r=>[orderGroupLabel(r.group),r.code,r.category,r.name,v(r.net),r.unit,v(r.demand),v(r.coverage),r.pack,v(r.packs),v(r.purchased),v(r.price),v(r.materialCost),r.category==='Consommable'?'Sans pose séparée':v(r.laborRate),v(r.laborCost),r.issues.join(' · ')])];
  const detail=[['Page','Feuille','Zone source','Poste','Référence','Bloc','Étage','Unité / modèle','Type','Mesure unique','Répétitions','Net prévu','Perte (%)','Besoin avec perte','Unité','Contrôles'],
    ...lines.map(l=>[l.page,pageName(l.page),l.name,l.category,l.code,l.block,l.level,l.unit,l.type,v(l.measured),l.repeat,v(l.net),l.waste,v(l.demand),profile(l.code).unit,l.issues.join(' · ')])];
  const cat=[['Référence','Description','Unité de besoin','Rendement / emballage','Emballage','Prix / emballage','Pose / unité nette','Consommable 1','Rendement 1','Perte 1 (%)','Prix 1','Consommable 2','Rendement 2','Perte 2 (%)','Prix 2','Consommable 3','Rendement 3','Perte 3 (%)','Prix 3'],
    ...Object.keys(catalogDefaults()).map(code=>{const p=profile(code);return [code,p.name,p.unit,v(p.coverage),p.pack,v(p.price),v(p.labor),...[0,1,2].flatMap(i=>p.components[i]?[p.components[i].name,v(p.components[i].coverage),p.components[i].waste,v(p.components[i].price)]:['','','',''])];})];
  const units=new Map();
  for(const i of S.items){const w=workOf(i);if(i.measureOnly||!w.included)continue;const key=JSON.stringify([w.block,w.level,w.unit,w.type]);if(!units.has(key))units.set(key,{scope:[w.block,w.level,w.unit,w.type],repeats:new Set(),ids:new Set()});const u=units.get(key);u.repeats.add(w.repeat);u.ids.add(i.id);}
  const scope=[['Bloc','Étage','Unité / modèle','Type','Répétitions déclarées par zone','Zones incluses','Contrôle'],...Array.from(units.values(),u=>[...u.scope,[...u.repeats].join(' / '),u.ids.size,u.repeats.size>1?'Multiplicateurs différents dans la même unité : vérifier':'Les répétitions ne sont pas un comptage automatique de logements.'])];
  return [['Approvisionnement',orders],['Dérivés et répétitions',detail],['Assemblages',cat],['Portée des unités',scope]];
}

function quantityOrUnknown(n,unit='') {return n===null?'À vérifier':fmt(n,2)+(unit?' '+unit:'');}
function moneyOrUnknown(n) {return n===null?'À saisir':fmt(n,2)+' $';}
function estimateInspector(host,item) {
  const single=S.selection.size===1&&item;
  host.insertAdjacentHTML('beforeend',`<section class="v4-properties"><h3>Pose et approvisionnement · V5</h3>${single?`<p>${item.measureOnly?'Cote de référence · hors commandes':workOf(item).included?'Incluse dans l’estimation':'Exclue de l’estimation'} · répétition ×${workOf(item).repeat}${item.kind==='linear'&&workOf(item).lineRole==='wall'?' · céramique murale':''}</p><button type="button" id="workSheetBtn" class="selection-action">Fiche de pose : plinthes, murs et unité</button>`:'<p>Les surfaces du plan restent des mesures uniques. Les répétitions et composants apparaissent dans l’estimation.</p>'}<button type="button" id="estimateInspectorBtn" class="selection-action">Estimation et commandes</button><button type="button" id="catalogInspectorBtn" class="selection-action">Configurer les assemblages</button></section>`);
  if(single)$('#workSheetBtn').onclick=()=>workDialog(item.id);
  $('#estimateInspectorBtn').onclick=estimateDialog;$('#catalogInspectorBtn').onclick=()=>catalogDialog(single&&item.kind==='count'?'QT-01':single&&item.kind==='area'?item.material:'VP-01');
}
function countWorkDialog(id) {
  const item=S.items.find(item=>item.id===id&&item.kind==='count');if(!item)return;
  const work=workOf(item);
  openDialog('Fiche de comptage · '+item.name,`<form id="workForm"><p>${fmt(item.points.length,0)} élément(s) pointé(s) · unité u · aucune échelle requise.</p><label class="v5-check"><input id="workIncluded" type="checkbox" ${work.included?'checked':''}> Inclure ce comptage dans l’estimation après confirmation</label><div class="v4-fields">${[['workBlock','Bloc',work.block],['workLevel','Étage',work.level],['workUnit','Unité / modèle',work.unit],['workType','Type d’unité',work.type]].map(([field,label,value])=>`<label>${label}<input id="${field}" maxlength="80" value="${esc(value)}"></label>`).join('')}<label>Répétitions<input id="workRepeat" type="number" min="1" max="999" step="1" value="${work.repeat}" required></label></div><p>Les unités sont séparées des longueurs et surfaces. Aucun périmètre, perte ou consommable surfacique n’est appliqué.</p><p id="workError" class="v4-error" role="alert"></p><div class="modal-actions"><button id="cancelWork" type="button">Annuler</button><button type="submit" class="primary">Enregistrer la fiche</button></div></form>`);
  $('#cancelWork').onclick=closeDialog;
  $('#workForm').onsubmit=event=>{event.preventDefault();try{
    setWork(id,{...work,included:$('#workIncluded').checked,block:$('#workBlock').value.trim(),level:$('#workLevel').value.trim(),unit:$('#workUnit').value.trim(),type:$('#workType').value.trim(),repeat:Number($('#workRepeat').value)});closeDialog();toast('Fiche de comptage enregistrée.');
  }catch(error){$('#workError').textContent=error.message;}};
}
function workDialog(id) {
  const item=S.items.find(i=>i.id===id);if(!item)return;
  if(item.kind==='count')return countWorkDialog(id);
  if(isWallTakeoff(item)&&item.wallTakeoff)return openWallTakeoffDialog(item.id);
  if(item.measureOnly)return openDialog('Cote de référence',`<p>${esc(item.name)} · ${itemQuantityText(item)}</p><p>Cette mesure sert de référence et reste exclue des commandes.</p>`);
  const w=workOf(item),measure=measureForEstimate(item),linear=item.kind==='linear';
  openDialog('Fiche de pose · '+item.name,`<form id="workForm"><p>Source : ${esc(pageName(item.page))} · ${quantityOrUnknown(measure,linear?'pi':'pi²')}. La géométrie du plan reste mesurée une seule fois.</p>
    <label class="v5-check"><input id="workIncluded" type="checkbox" ${w.included?'checked':''}> Inclure cette zone dans l’estimation</label>
    <h3>Localisation et répétitions</h3><div class="v4-fields">
    ${[['workBlock','Bloc',w.block],['workLevel','Étage',w.level],['workUnit','Unité / modèle',w.unit],['workType','Type d’unité',w.type]].map(([id,label,value])=>`<label>${label}<input id="${id}" value="${esc(value)}" maxlength="80"></label>`).join('')}
    <label>Répétitions de cette zone<input id="workRepeat" type="number" value="${w.repeat}" min="1" max="999" step="1" required></label></div>
    <p>1 = cette mesure seule. Pour une unité type, entrez le même nombre sur toutes ses pièces. Excluez les copies déjà mesurées pour éviter de les compter deux fois.</p>
    ${linear?`<h3>Utilisation de la ligne</h3><label>Poste<select id="workLineRole"><option value="baseboard" ${w.lineRole==='baseboard'?'selected':''}>Plinthe / moulure · longueur</option><option value="wall" ${w.lineRole==='wall'?'selected':''}>Céramique murale / dosseret · longueur × hauteur</option></select></label><div class="v4-fields">
    <label>Hauteur murale (po)<input id="workHeight" type="number" value="${w.wall.height}" min="0.01" max="1200" step="any" required></label><label>Ouvertures à retrancher (pi²)<input id="workOpenings" type="number" value="${w.wall.openings}" min="0" step="any" required></label><label>Perte céramique murale (%)<input id="workWallWaste" type="number" value="${w.wall.waste}" min="0" max="1000" step="any" required></label></div><p>Surface murale nette = longueur mesurée × hauteur / 12 − ouvertures. Exemple : 96 po = 8 pi. Le poste mural est séparé du plancher dans les commandes.</p>`:
    `<h3>Plinthe liée au contour</h3><label class="v5-check"><input id="workBaseboard" type="checkbox" ${w.baseboard.enabled?'checked':''}> Calculer la plinthe depuis le périmètre extérieur</label><div class="v4-fields"><label>Référence de plinthe<select id="workBaseCode">${Object.keys(catalogDefaults()).filter(c=>c.startsWith('PL-')).map(c=>`<option value="${c}" ${c===w.baseboard.code?'selected':''}>${c} · ${esc(profile(c).name)}</option>`).join('')}</select></label><label>Portes / parties sans plinthe (pi)<input id="workDeductions" type="number" min="0" step="any" value="${w.baseboard.deductions}" required></label><label>Perte de plinthe (%)<input id="workBaseWaste" type="number" min="0" max="1000" step="any" value="${w.baseboard.waste}" required></label></div><p>Périmètre extérieur : ${quantityOrUnknown(measure===null?null:perimeter(item.points)*S.scales[item.page],'pi')}. Les trous intérieurs ne créent pas de plinthes. Vérifiez les limites des sous-zones et les ouvertures de portes.</p>`}
    <p id="workError" class="v4-error" role="alert"></p><div class="modal-actions"><button type="button" id="cancelWork">Annuler</button><button type="submit" class="primary">Enregistrer la fiche</button></div></form>`,'wide');
  $('#cancelWork').onclick=closeDialog;
  $('#workForm').onsubmit=event=>{event.preventDefault();try {
    const value={...w,included:$('#workIncluded').checked,block:$('#workBlock').value.trim(),level:$('#workLevel').value.trim(),unit:$('#workUnit').value.trim(),type:$('#workType').value.trim(),repeat:Number($('#workRepeat').value)};
    if(linear){value.lineRole=$('#workLineRole').value;value.wall={height:Number($('#workHeight').value),openings:Number($('#workOpenings').value),waste:Number($('#workWallWaste').value)};}
    else value.baseboard={enabled:$('#workBaseboard').checked,code:$('#workBaseCode').value,deductions:Number($('#workDeductions').value),waste:Number($('#workBaseWaste').value)};
    setWork(id,value);closeDialog();toast('Fiche enregistrée. Les quantités dérivées suivent la géométrie.');
  }catch(error){$('#workError').textContent=error.message;}};
}
function nullableField(id,min=0) {
  const raw=$('#'+id).value.trim();if(!raw)return null;const n=Number(raw.replace(',','.'));
  if(!finiteRange(n,min,1e9))throw new Error('Vérifiez les rendements et les prix : un rendement doit être supérieur à zéro.');return n;
}
function catalogDialog(code='VP-01') {
  if(!Object.hasOwn(catalogDefaults(),code))code='VP-01';
  const p=profile(code),linear=p.unit!=='pi²';
  const input=(id,label,value,min=0)=>`<label>${label}<input id="${id}" type="number" step="any" min="${min}" value="${value??''}" placeholder="À saisir"></label>`;
  openDialog('Assemblages de revêtement',`<label>Référence à configurer<select id="catalogCode">${Object.keys(catalogDefaults()).map(c=>`<option value="${c}" ${c===code?'selected':''}>${c} · ${esc(profile(c).name)}</option>`).join('')}</select></label><p>Ces paramètres s’appliquent à toutes les zones de cette référence, dans ce projet. Enregistrez avant de changer de référence.</p>
    <form id="catalogForm"><div class="v4-fields"><label>Description<input id="catalogName" value="${esc(p.name)}" maxlength="120" required></label><label>Nom de l’emballage<input id="catalogPack" value="${esc(p.pack)}" maxlength="30" required></label>
    ${input('catalogCoverage','Couverture ('+p.unit+' / emballage)',p.coverage,0.000001)}${input('catalogPrice','Prix matière ($ / emballage)',p.price)}${input('catalogLabor','Pose ($ / '+p.unit+' net)',p.labor)}</div>
    ${linear?'':`<h3>Consommables liés à la surface nette</h3><p>Colle, membrane, primaire, mortier ou ragréage : utilisez le rendement de la fiche technique pour la méthode et l’épaisseur choisies. Chaque consommable a sa propre perte ; la perte du fini n’est pas ajoutée à nouveau. Laissez le nom vide pour retirer une ligne.</p>
    ${[0,1,2].map(i=>{const c=p.components[i]||{name:'',pack:'sac',coverage:null,waste:0,price:null};return `<fieldset class="v5-component"><legend>Consommable ${i+1} · ${code}-C${i+1}</legend><div class="v4-fields"><label>Nom<input id="componentName${i}" value="${esc(c.name)}" maxlength="120"></label><label>Emballage<input id="componentPack${i}" value="${esc(c.pack)}" maxlength="30"></label>${input('componentCoverage'+i,'Rendement (pi² / emballage)',c.coverage,0.000001)}${input('componentWaste'+i,'Perte propre (%)',c.waste)}${input('componentPrice'+i,'Prix ($ / emballage)',c.price)}</div></fieldset>`;}).join('')}`}
    <p>Une case de prix vide reste inconnue. Saisissez 0 seulement si le poste est réellement inclus ou gratuit. Les consommables sont regroupés par assemblage ; aucune fusion de produits différents n’est effectuée.</p><p id="catalogError" class="v4-error" role="alert"></p><div class="modal-actions"><button type="button" id="catalogOrders">Voir les commandes</button><button type="submit" class="primary">Enregistrer l’assemblage</button></div></form>`,'wide');
  $('#catalogCode').onchange=event=>catalogDialog(event.target.value);$('#catalogOrders').onclick=estimateDialog;
  $('#catalogForm').onsubmit=event=>{event.preventDefault();try {
    const value={name:$('#catalogName').value.trim(),unit:p.unit,pack:$('#catalogPack').value.trim(),coverage:nullableField('catalogCoverage',0.000001),price:nullableField('catalogPrice'),labor:nullableField('catalogLabor'),components:[]};
    if(!linear)for(let i=0;i<3;i++){const name=$('#componentName'+i).value.trim();if(name)value.components.push({name,pack:$('#componentPack'+i).value.trim(),coverage:nullableField('componentCoverage'+i,0.000001),waste:nullableField('componentWaste'+i)??0,price:nullableField('componentPrice'+i)});}
    setProfile(code,value);$('#catalogError').textContent='';toast('Assemblage enregistré pour ce projet.');
  }catch(error){$('#catalogError').textContent=error.message;}};
}
function estimateDialog() {
  const lines=estimateLines(),rows=purchaseRows(lines),t=estimateTotals(rows,lines);
  openDialog('Estimation et commandes',`<p id="estimatePendingNote">${S.items.filter(item=>!item.measureOnly&&!isConfirmed(item)).length} mesure(s) à valider exclue(s) des commandes.</p><p>Seuls les relevés confirmés sont inclus ; surfaces et longueurs exigent une échelle vérifiée. Les cotes restent hors commandes. Les quantités ci-dessous incluent les répétitions déclarées. Les mesures uniques restent dans la grille du plan et les feuilles de mesures Excel.</p><div class="v5-stats"><div><span>Sol net prévu</span><b>${quantityOrUnknown(t.floorUnknown?null:t.floor,'pi²')}</b></div><div><span>Murs / dosserets</span><b>${quantityOrUnknown(t.wallUnknown?null:t.wall,'pi²')}</b></div><div><span>Plinthes prévues</span><b>${quantityOrUnknown(t.linearUnknown?null:t.linear,'pi')}</b></div><div><span>${t.incomplete?'Sous-total connu · incomplet':'Coût estimé hors taxes'}</span><b>${fmt(t.knownCost,2)} $</b></div></div>
    <div class="v5-toolbar"><label>Regrouper avant d’arrondir<select id="purchaseGroup"><option value="project" ${S.estimation.group==='project'?'selected':''}>Projet entier · réserve commune</option><option value="floor" ${S.estimation.group==='floor'?'selected':''}>Bloc + étage · commandes séparées</option></select></label><button type="button" id="orderCatalog">Configurer les assemblages</button><button type="button" id="orderExport" class="primary">Exporter Excel</button></div>
    <p>Commander = arrondi supérieur du besoin regroupé ÷ couverture par emballage. Coût matière = emballages entiers × prix ; pose = net prévu × tarif. Montants en $, hors taxes et transport. ${t.checks?`${t.checks} poste(s) présentent des données ou contrôles à compléter.`:''}</p>
    <div class="v5-order-table"><table><thead><tr><th>Groupe / référence</th><th>Poste</th><th>Net prévu</th><th>Besoin avec perte</th><th>Couverture</th><th>Commander</th><th>Matière</th><th>Pose</th><th>Contrôles</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td><small>${esc(orderGroupLabel(r.group))}</small><b>${esc(r.code)}</b><small>${esc(r.name)}</small></td><td>${esc(r.category)}</td><td>${quantityOrUnknown(r.net,r.unit)}</td><td>${quantityOrUnknown(r.demand,r.unit)}</td><td>${r.coverage===null?'À saisir':fmt(r.coverage,3)+' '+r.unit+' / '+esc(r.pack)}</td><td><b>${r.packs===null?'À compléter':fmt(r.packs,0)+' '+esc(r.pack)+(r.packs>1?'(s)':'')}</b></td><td>${moneyOrUnknown(r.materialCost)}</td><td>${r.category==='Consommable'?'Incluse dans la pose du fini':moneyOrUnknown(r.laborCost)}</td><td>${r.issues.length?esc(r.issues.join(' · ')):'Paramètres renseignés'}</td></tr>`).join(''):'<tr><td colspan="9">Aucune mesure confirmée incluse. Révisez puis confirmez les surfaces dans le tableau du plan.</td></tr>'}</tbody></table></div>
    <details class="v5-sources"><summary>Sources et répétitions · ${lines.length} poste(s) dérivé(s)</summary><div class="v5-order-table"><table><thead><tr><th>Page</th><th>Zone</th><th>Localisation</th><th>Poste</th><th>Mesure unique</th><th>Répétitions</th><th>Net prévu</th><th>Contrôles</th></tr></thead><tbody>${lines.map(l=>`<tr><td>${l.page}</td><td>${esc(l.name)}</td><td>${esc([l.block,l.level,l.unit,l.type].filter(Boolean).join(' / ')||'Non renseignée')}</td><td>${esc(l.category)}</td><td>${quantityOrUnknown(l.measured,profile(l.code).unit)}</td><td>×${l.repeat}</td><td>${quantityOrUnknown(l.net,profile(l.code).unit)}</td><td>${esc(l.issues.join(' · '))}</td></tr>`).join('')}</tbody></table></div></details>
    <p>Les plinthes liées sont ajoutées uniquement après activation dans chaque fiche. Déduisez les portes et vérifiez les changements de fini. Un calepinage de carreaux ne remplace pas l’arrondi des boîtes ni un plan de coupe.</p>`,'v5-wide');
  $('#purchaseGroup').onchange=event=>{remember();S.estimation.group=event.target.value;save();estimateDialog();};
  $('#orderCatalog').onclick=()=>catalogDialog();$('#orderExport').onclick=exportExcel;
}
function initEstimationUI() {
  $('#estimateNav').onclick=estimateDialog;$('#catalogNav').onclick=()=>catalogDialog();$('#reportNav').onclick=takeoffDrawer;
  $('#saveProjectBtn').insertAdjacentHTML('beforebegin','<button type="button" id="ordersBtn" title="Estimation et commandes · F4"><i data-lucide="package-check"></i><span>Estimation<br>et commandes</span><kbd>F4</kbd></button>');
  $('#ordersBtn').onclick=estimateDialog;
  $('.grid-head b').textContent='MESURES UNIQUES';$('#takeoffBtn').setAttribute('title','Rapport des mesures uniques, sans répétitions');
}

Object.assign(S,{estimation:readSaved('quantif-document-v3:legacy',{}).estimation||{catalog:{},group:'project'},sheetNames:{},settings:{doorInches:36,minArea:1,threshold:180,bathroomMaterial:'CER-12X24',surfaceDisplay:'spaces',surfaceLabels:true},dividers:{},detectBounds:{},indexToken:0,indexedPages:0,indexing:false,preview:null,detectorCache:null});
$('#tools').innerHTML=TOOLS.map(([id,icon,label,key])=>`<button data-tool="${id}" title="${label} (${key})"><i data-lucide="${icon}"></i><span>${label}</span><kbd>${key}</kbd></button>`).join('')+`<button data-tool="divider" title="Fermer un passage (B)"><i data-lucide="door-closed"></i><span>Fermer<br>un passage</span><kbd>B</kbd></button><button data-tool="edit" title="Modifier les coins (E)"><i data-lucide="square-pen"></i><span>Modifier<br>les coins</span><kbd>E</kbd></button><button data-tool="region" title="Cadre de détection (R)"><i data-lucide="scan"></i><span>Cadre<br>de détection</span><kbd>R</kbd></button><small>Mesurer et corriger</small>`;
$('#tileSettings').insertAdjacentHTML('afterend','<button type="button" id="tileOriginBtn" title="Point de départ de céramique · T"><i data-lucide="locate-fixed"></i><span>Point<br>de départ</span><kbd>T</kbd></button>');
$('.zoom').insertAdjacentHTML('beforeend','<button type="button" id="fitView" aria-label="Afficher toute la feuille">⛶</button>');
$('.side-search input').id='sheetSearch';$('.side-search input').setAttribute('aria-label','Rechercher une feuille');
$('.tree').insertAdjacentHTML('beforeend','<div id="sheetList" class="sheet-list"></div><p class="sheet-index-status" id="sheetIndexStatus"></p>');
$('.stagebar .document').insertAdjacentHTML('afterbegin','<button type="button" id="togglePages" class="v4-small-button" title="Afficher ou masquer les pages" aria-label="Afficher ou masquer les pages">☰</button>');
$('.stagebar').insertAdjacentHTML('beforeend','<button type="button" id="showProperties" class="v4-small-button" title="Afficher les propriétés" aria-label="Afficher les propriétés">☷</button>');
$('#aiAnalyze').innerHTML='<i data-lucide="scan-line"></i><span>Contours intérieurs<br><b>Détecter les pièces</b></span>';
$('#aiReview').innerHTML='<i data-lucide="list-checks"></i><span>Réviser<br>les quantités</span>';
$('#gridRows').innerHTML='<tr><td colspan="7">Ouvrez un plan, vérifiez son échelle, puis détectez ou tracez les pièces.</td></tr>';
$('#toast').setAttribute('role','status');$('#toast').setAttribute('aria-live','polite');
$('#projectName').setAttribute('aria-label','Nom du projet');$('#zoomIn').setAttribute('aria-label','Zoomer');$('#zoomOut').setAttribute('aria-label','Dézoomer');

canvas.onwheel=event=>{
  if(!S.plan||S.loading)return;event.preventDefault();const rect=canvas.getBoundingClientRect();
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1);
  zoomAt(S.zoom*Math.exp(-Math.max(-400,Math.min(400,delta))*.0018),event.clientX-rect.left,event.clientY-rect.top);
};
canvas.onclick=event=>{
  if(!S.plan||S.loading||S.dragged){S.dragged=false;return;}
  if(event.detail>1||S.spaceHeld)return;
  const point=snapPoint(canvasPoint(event),event);
  if(handleManualClick(point,event))return;
  if(['fixtureBox','fixturePolygon'].includes(S.tool)){if(!S.draft.length||dist(S.draft.at(-1),point)>.5)S.draft.push(point);if(S.tool==='fixtureBox'&&S.draft.length===2)finishFixtureDrawing();}
  else if(S.tool==='select')selectSurfaceAt(point,event);
  else if(S.tool==='tileOrigin')setTileOrigin(S.selected,point);
  else if(S.tool==='auto')detectRoom(point);
  else if(['area','split','exclude','linear','wallTrace','calibrate','divider','region'].includes(S.tool)) {
    if(!S.draft.length||dist(S.draft.at(-1),point)>.5)S.draft.push(point);
    if(S.tool==='calibrate'&&S.draft.length===2){if(dist(...S.draft)<2){S.draft.pop();toast('Choisissez deux points distincts.');}else calibrationModal(S.calibrationMode||'imperial');}
    else if(S.tool==='split'&&S.draft.length===2)finishSurfaceSplit();
    else if(['divider','region'].includes(S.tool))finishTwoPointTool(point);
  }
  refreshManualUI();
};
canvas.ondblclick=event=>{
  event.preventDefault();if(S.loading)return;
  if(finishManualTool())return;
  if(['area','split','exclude'].includes(S.tool)&&S.draft.length>=3)finishArea(S.draft);
  else if(S.tool==='linear'&&S.draft.length>=2)finishLine(S.draft);
  else if(S.tool==='fixturePolygon'&&S.draft.length>=3)finishFixtureDrawing();
  else if(['select','edit','fixtureEdit'].includes(S.tool)){const hit=surfaceForEdit(canvasPoint(event));if(hit)openItemEditor(hit.id);else if(S.tool==='select')zoomSelection();}
};
canvas.oncontextmenu=event=>{event.preventDefault();if(S.draft.length){S.draft.pop();refresh();}else {S.tool='select';refresh();}};
canvas.onpointerdown=event=>{
  if(!S.plan||S.loading)return;S.dragged=false;canvas.focus();
  if(event.button===1||(S.spaceHeld||S.tool==='hand')&&event.button===0) {
    event.preventDefault();S.dragged=true;S.panning={x:event.clientX,y:event.clientY,pan:{...S.pan}};canvas.setPointerCapture?.(event.pointerId);canvas.style.cursor='grabbing';return;
  }
  if(event.button!==0)return;
  const item=S.items.find(i=>i.id===S.selected),point=canvasPoint(event);
  if(fixturePointerDown(event,point))return;
  const editable=focusedSurfaceEdit();
  if(editable) {
    const index=editable.item.points.findIndex(p=>dist(p,point)<=10/S.zoom);
    if(index>=0){S.dragging={type:editable.preview?'previewVertex':'vertex',id:editable.item.id,index,indexInReview:editable.index,before:snapshot(),start:point};canvas.setPointerCapture?.(event.pointerId);event.preventDefault();}
  }else if(S.tool==='tileOrigin'&&item&&dist(tileLayout(item).origin,point)<=14/S.zoom) {
    S.dragging={type:'origin',id:item.id,before:snapshot(),start:point};canvas.setPointerCapture?.(event.pointerId);event.preventDefault();
  }
};
canvas.onpointermove=event=>{
  const point=snapPoint(canvasPoint(event),event);S.mouseWorld=point;refreshManualUI();
  if(S.panning){S.pan={x:S.panning.pan.x+event.clientX-S.panning.x,y:S.panning.pan.y+event.clientY-S.panning.y};return;}
  if(S.dragging) {
    if(dist(point,S.dragging.start)*S.zoom>3)S.dragged=true;
    const item=S.dragging.type==='previewVertex'?S.reviewByPage[S.page]?.items[S.dragging.indexInReview]:S.items.find(i=>i.id===S.dragging.id);if(!item)return;
    if(S.dragging.type==='fixtureVertex'){const cut=item.fixtureCuts?.find(c=>c.id===S.dragging.cutId);if(cut)cut.points[S.dragging.index]=point;}
    else if(S.dragging.type==='origin')setTileOrigin(item.id,point,false);
    else item.points[S.dragging.index]=point;
  }
};
canvas.onpointerup=event=>{
  if(S.dragging){const drag=S.dragging;S.dragging=null;if(S.dragged)commitDrag(drag);else restoreSnapshot(drag.before);}
  S.panning=null;canvas.style.cursor=S.tool==='hand'?'grab':S.tool==='select'?'default':'crosshair';
  if(canvas.hasPointerCapture?.(event.pointerId))canvas.releasePointerCapture(event.pointerId);
};
canvas.onpointercancel=()=>{if(S.dragging){const before=S.dragging.before;S.dragging=null;restoreSnapshot(before);}S.panning=null;S.dragged=true;};
$$('[data-tool]').forEach(button=>button.onclick=()=>activateTool(button.dataset.tool));
$('#uploadBtn').onclick=()=>$('#fileInput').click();$('#fileInput').onchange=event=>{loadFile(event.target.files[0]);event.target.value='';};
const openDemo=async()=>{
  const token=++S.loadVersion;++S.renderVersion;++S.indexToken;S.loading=false;
  openDocument('demo','Plan exemple',null,1);S.scales[1]=50/996;S.scaleMeta[1]={source:'example',label:'Exemple · cote 50 pi',verified:true};
  S.sheetNames[1]={code:'DÉMO',title:'Plan fictif de démonstration'};const image=await decodeImage(demoPlan());if(token!==S.loadVersion||S.documentKey!=='demo')return;S.plan=image;fitPlan(image);
  const demoLabels=[['BUREAU 101',290,200],['RÉCEPTION 102',650,200],['CHAMBRE 103',950,200],['BUREAU 104',290,500],['CORRIDOR',650,440],['SALLE DE BAIN',650,600],['CUISINE 106',950,510]];
  const finishes=['VP-01','CER-01','TAP-01','VP-01','CER-01','CER-12X24','CER-01'];
  const measure=document.createElement('canvas').getContext('2d');
  const texts=demoLabels.flatMap(([text,cx,cy],index)=>{
    const size=index===5?24:26;measure.font=size+'px Arial';const width=measure.measureText(text).width;
    measure.font='18px Arial';const code=finishes[index],codeWidth=measure.measureText(code).width;
    return [{text,x:cx-width/2-2,y:cy-size-2,width:width+4,height:size+5,cx,cy:cy-size/2},
      {text:code,x:cx-codeWidth/2-2,y:cy+35-20,width:codeWidth+4,height:23,cx,cy:cy+26}];
  });
  S.settings={...S.settings,doorInches:48};
  S.pageInfo[1]={labels:demoLabels.map(([text,cx,cy])=>({text,cx,cy:cy-13})),texts,contentRight:1200};
  save();refresh();toast('Plan fictif · cote 50 pi · fermeture des ouvertures réglée à 48 po.');
};
$('#demoBtn').onclick=openDemo;$('#emptyDemo').onclick=openDemo;
$('#zoomIn').onclick=()=>zoomAt(S.zoom*1.2);$('#zoomOut').onclick=()=>zoomAt(S.zoom/1.2);$('#fitView').onclick=()=>{fitPlan();refresh();};
$('#projectName').oninput=event=>{S.project=event.target.value;$('#treeProject').textContent=S.project;save();};
$('#takeoffBtn').onclick=takeoffDrawer;$('#exportBtn').onclick=exportExcel;
$('#aiAnalyze').onclick=analyzeAll;$('#aiReview').onclick=takeoffDrawer;
$('#prevPage').onclick=()=>showPage(S.page-1);$('#nextPage').onclick=()=>showPage(S.page+1);
$('#undo').onclick=undoChange;$('#redo').onclick=redoChange;$('#deleteSelection').onclick=deleteSelection;
$('#scaleStatus').onclick=()=>calibrationModal();
$('#scaleStatus').onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();calibrationModal();}};
$('#reopen').onclick=$('#showProperties').onclick=()=>{if(S.reviewOpen)closeReview();$('#inspector').hidden=false;$('#reopen').hidden=true;};
$('#togglePages').onclick=()=>$('.app').classList.toggle('pages-folded');
$('.sidebar .pane-title button').onclick=()=>$('.app').classList.add('pages-folded');
$('#collapseGrid').onclick=()=>{const grid=$('.quantity-grid');grid.classList.toggle('collapsed');const h=grid.classList.contains('collapsed')?'32px':'176px';grid.style.height=h;grid.style.flexBasis=h;};
$('#sheetSearch').oninput=renderPages;$('#stageFile').ondblclick=renameSheet;
window.onkeydown=keyboard;window.onkeyup=event=>{if(event.key===' '){S.spaceHeld=false;canvas.style.cursor=S.tool==='hand'?'grab':'crosshair';}};
window.onblur=()=>{S.spaceHeld=false;if(S.dragging){const before=S.dragging.before;S.dragging=null;restoreSnapshot(before);}S.panning=null;};
$('#toggleTileGrid').onclick=()=>{S.tileGrid=!S.tileGrid;refresh();};$('#tileSettings').onclick=tileModal;$('#tileOriginBtn').onclick=activateOrigin;
$('#helpBtn').onclick=helpDialog;$('#saveProjectBtn').onclick=exportProject;
$('#projectInput').onchange=event=>{importProject(event.target.files[0]);event.target.value='';};
initEstimationUI();initV7();initManualUI();initFoldersUI();
canvas.tabIndex=0;canvas.setAttribute('aria-label','Plan : zoom à la molette, sélection, détection et tracé des mesures');
if(window.innerWidth<780){$('#inspector').hidden=true;$('#reopen').hidden=false;$('.app').classList.add('pages-folded');}
lucide.createIcons({attrs:{width:18,height:18,'stroke-width':1.8}});refresh();
