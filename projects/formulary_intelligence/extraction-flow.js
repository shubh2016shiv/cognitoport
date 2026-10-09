/* Pharmacological Intervention Extraction — mounted ReactFlow LLD. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  person:["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8","M4 21a8 8 0 0 1 16 0"],
  plan:["M5 4h14v16H5z","M8 8h8","M8 12h8","M8 16h5"],
  search:["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14","m16 16 4.5 4.5"],
  branch:["M7 4v7a4 4 0 0 0 4 4h6","M7 20v-5","m14 12 3 3-3 3"],
  list:["M8 6h12","M8 12h12","M8 18h12","M4 6h.01","M4 12h.01","M4 18h.01"],
  check:["M20 6 9 17l-5-5"],
  skip:["M5 5l14 14","M19 5 5 19"],
  warn:["M12 3 2 20h20z","M12 9v5","M12 17h.01"],
  loop:["M20 7h-6a7 7 0 1 0 6 10","m17 4 3 3-3 3"],
  arrow:["M4 12h14","m13 7 5 5-5 5"],
  stop:["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18","m6 6 12 12"]
};

function Icon({name}) {
  return h("svg", { viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:1.7, strokeLinecap:"round", strokeLinejoin:"round" },
    (ICONS[name] || ICONS.list).map((d,i) => h("path", { d, key:i }))
  );
}

const HANDLES = [
  h(Handle,{type:"target",position:Position.Left,id:"left",key:"tl",className:"rf-handle"}),
  h(Handle,{type:"target",position:Position.Top,id:"top",key:"tt",className:"rf-handle"}),
  h(Handle,{type:"target",position:Position.Right,id:"target-right",key:"tr",className:"rf-handle"}),
  h(Handle,{type:"source",position:Position.Right,id:"right",key:"sr",className:"rf-handle"}),
  h(Handle,{type:"source",position:Position.Bottom,id:"bottom",key:"sb",className:"rf-handle"}),
  h(Handle,{type:"source",position:Position.Left,id:"source-left",key:"sl",className:"rf-handle"})
];

function StepNode({data}) {
  return h("div", {
    className:`rf-node rf-node--${data.kind} is-clickable`, tabIndex:0, role:"group",
    "aria-label":`${data.title}. Press Enter for details.`,
    onClick:e=>data.onOpen?.(e.currentTarget,data.id),
    onKeyDown:e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();data.onOpen?.(e.currentTarget,data.id);}}
  }, ...HANDLES,
    data.seq ? h("span",{className:"rf-node-sequence"},data.seq) : null,
    h("div",{className:"rf-node-main"},
      h("span",{className:"rf-node-icon"},h(Icon,{name:data.icon})),
      h("div",{className:"rf-node-copy"},h("p",{className:"rf-node-title"},data.title),h("p",{className:"rf-node-sub"},data.sub))
    )
  );
}
function LaneNode({data}) {
  return h("div",{className:"rf-lane"},...HANDLES,
    h("span",{className:"rf-lane-label"},h("strong",null,data.title),h("span",{className:"rf-lane-annotation"},` — ${data.hint}`))
  );
}
const NODE_TYPES={step:StepNode,lane:LaneNode};

const LAYOUT=[
  {id:"L1",type:"lane",x:20,y:20,w:1260,h:465,title:"Retrieve the recommendation record",hint:"coverage has already passed; this phase now needs the patient's clinical actions"},
  {id:"PATIENT",type:"step",x:90,y:78,w:470,h:82,kind:"source",icon:"person",seq:"01",title:"Patient ID",sub:"Identifies which recommendation record must be retrieved."},
  {id:"PLAN",type:"step",x:740,y:78,w:470,h:82,kind:"source",icon:"plan",title:"Active plan context",sub:"Coverage is present, so formulary enrichment is allowed to continue."},
  {id:"REQUEST",type:"step",x:390,y:195,w:520,h:92,kind:"handoff",icon:"search",seq:"02",title:"Request the patient's recommendation record",sub:"Retrieve diagnoses and their recommended actions for this Patient ID."},
  {id:"RECORD_GATE",type:"step",x:390,y:323,w:520,h:82,kind:"gate",icon:"branch",title:"Was a recommendation record returned?",sub:"Missing or failed retrieval cannot produce extractable actions."},
  {id:"STOP_RECORD",type:"step",x:965,y:323,w:265,h:105,kind:"blocked",icon:"stop",title:"No → stop formulary enrichment",sub:"No recommendation record is available."},
  {id:"REF_GATE",type:"step",x:390,y:430,w:520,h:82,kind:"gate",icon:"branch",title:"Is its recommendation reference present?",sub:"The result must remain linked to the source recommendation record."},
  {id:"STOP_REF",type:"step",x:965,y:438,w:265,h:105,kind:"blocked",icon:"stop",title:"No → stop formulary enrichment",sub:"The record cannot be safely updated later."},

  {id:"L2",type:"lane",x:20,y:520,w:1260,h:665,title:"Extract pharmacological actions",hint:"inspect every action, keep only complete medication-related work units"},
  {id:"READ",type:"step",x:390,y:575,w:520,h:82,kind:"exact",icon:"list",title:"Read actions across every diagnosis",sub:"Flatten the nested recommendation structure into actions to inspect."},
  {id:"NEXT",type:"step",x:390,y:685,w:520,h:76,kind:"exact",icon:"list",title:"Inspect the next action",sub:"Each action is evaluated independently."},
  {id:"TYPE_GATE",type:"step",x:390,y:790,w:520,h:86,kind:"gate",icon:"branch",title:"Is it pharmacological intervention or pharmacotherapy?",sub:"Only medication-related recommendation types belong in this pipeline."},
  {id:"SKIP_OTHER",type:"step",x:65,y:790,w:270,h:95,kind:"similarity",icon:"skip",title:"No → skip this action",sub:"Lifestyle, monitoring, referral, and other actions are left unchanged."},
  {id:"COMPLETE_GATE",type:"step",x:390,y:905,w:520,h:86,kind:"gate",icon:"branch",title:"Are the action identifier and action name present?",sub:"Both values are required for downstream classification and rejoining."},
  {id:"SKIP_INCOMPLETE",type:"step",x:1015,y:905,w:220,h:102,kind:"similarity",icon:"warn",title:"No → skip incomplete action",sub:"Do not manufacture a missing identifier or action name."},
  {id:"KEEP",type:"step",x:390,y:1020,w:520,h:78,kind:"container",icon:"check",title:"Yes → keep the action identifier and action name",sub:"Preserve the upstream identifier; this phase does not create a new one."},
  {id:"MORE",type:"step",x:390,y:1125,w:520,h:82,kind:"gate",icon:"loop",title:"Are more actions remaining?",sub:"Continue until every action across every diagnosis has been inspected."},

  {id:"L3",type:"lane",x:20,y:1220,w:1260,h:330,title:"Choose the extraction handoff",hint:"the list itself is the gate to drug-class identification"},
  {id:"ANY",type:"step",x:390,y:1275,w:520,h:82,kind:"gate",icon:"branch",title:"Were any eligible, complete actions kept?",sub:"An empty list means there is nothing the formulary pipeline can enrich."},
  {id:"STOP_EMPTY",type:"step",x:90,y:1400,w:470,h:105,kind:"blocked",icon:"stop",title:"No → stop formulary enrichment",sub:"Preserve the clinical recommendations without adding formulary drugs."},
  {id:"GO",type:"step",x:740,y:1400,w:470,h:105,kind:"output",icon:"arrow",title:"Yes → carry actions to drug-class identification",sub:"Pass the action list with its recommendation reference and active plan context."}
];

const EDGES=[
  ["patient-request","PATIENT","REQUEST",{sh:"bottom",th:"top"}], ["plan-request","PLAN","REQUEST",{sh:"bottom",th:"top"}],
  ["request-record","REQUEST","RECORD_GATE",{sh:"bottom",th:"top"}], ["record-no","RECORD_GATE","STOP_RECORD",{sh:"right",th:"left",label:"No",color:"#a2453c"}],
  ["record-yes","RECORD_GATE","REF_GATE",{sh:"bottom",th:"top",label:"Yes"}], ["ref-no","REF_GATE","STOP_REF",{sh:"right",th:"left",label:"No",color:"#a2453c"}],
  ["ref-yes","REF_GATE","READ",{sh:"bottom",th:"top",label:"Yes",color:"#2f7a4a"}], ["read-next","READ","NEXT",{sh:"bottom",th:"top"}],
  ["next-type","NEXT","TYPE_GATE",{sh:"bottom",th:"top"}], ["type-no","TYPE_GATE","SKIP_OTHER",{sh:"source-left",th:"target-right",label:"No",color:"#6c766f"}],
  ["type-yes","TYPE_GATE","COMPLETE_GATE",{sh:"bottom",th:"top",label:"Yes"}], ["complete-no","COMPLETE_GATE","SKIP_INCOMPLETE",{sh:"right",th:"left",label:"No",color:"#6c766f"}],
  ["complete-yes","COMPLETE_GATE","KEEP",{sh:"bottom",th:"top",label:"Yes",color:"#2f7a4a"}], ["skip-other-more","SKIP_OTHER","MORE",{sh:"bottom",th:"left",color:"#6c766f"}],
  ["skip-incomplete-more","SKIP_INCOMPLETE","MORE",{sh:"bottom",th:"target-right",color:"#6c766f"}], ["keep-more","KEEP","MORE",{sh:"bottom",th:"top",color:"#2f7a4a"}],
  ["more-yes","MORE","NEXT",{sh:"right",th:"target-right",color:"#a9631a"}], ["more-no","MORE","ANY",{sh:"bottom",th:"top",label:"No"}],
  ["any-no","ANY","STOP_EMPTY",{sh:"bottom",th:"top",label:"No",color:"#a2453c"}], ["any-yes","ANY","GO",{sh:"bottom",th:"top",label:"Yes",color:"#2f7a4a"}]
];

function buildElements(onOpen) {
  const nodes=LAYOUT.map(n=>({id:n.id,type:n.type,position:{x:n.x,y:n.y},style:{width:n.w,height:n.h},data:{...n,onOpen},draggable:false,selectable:false,focusable:n.type!=="lane",zIndex:n.type==="lane"?0:3}));
  const edges=EDGES.map(([id,source,target,o])=>({id,source,target,sourceHandle:o.sh||"bottom",targetHandle:o.th||"top",type:"smoothstep",label:o.label,labelStyle:{fill:"#3f4a45",fontSize:11,fontWeight:700},labelBgStyle:{fill:"#f4f1e9",fillOpacity:.96},labelBgPadding:[7,4],labelBgBorderRadius:7,markerEnd:{type:MarkerType.ArrowClosed,width:15,height:15,color:o.color||"#879087"},style:{stroke:o.color||"#9aa198",strokeWidth:1.6},zIndex:4}));
  return {nodes,edges};
}
function ExtractionFlow() {
  const onOpen=React.useCallback((domNode,nodeId)=>{
    const detail=window.DIAGRAM_STAGES?.extraction?.details?.[nodeId];
    if(!detail||!domNode)return;
    window.showKnowledgeBubble?.(domNode.closest(".react-flow__node")||domNode,detail,{immediate:true});
  },[]);
  const {nodes,edges}=React.useMemo(()=>buildElements(onOpen),[onOpen]);
  return h(ReactFlow,{nodes,edges,nodeTypes:NODE_TYPES,fitView:true,fitViewOptions:{padding:.035},minZoom:.3,maxZoom:1.4,nodesDraggable:false,nodesConnectable:false,elementsSelectable:false,zoomOnScroll:true,zoomOnDoubleClick:false,proOptions:{hideAttribution:false}},h(Background,{gap:22,size:1,color:"rgba(16,22,20,.08)"}),h(Controls,{showInteractive:false}));
}

let root=null;
window.mountExtractionReactFlow=function(){
  const container=document.getElementById("knowledgeReactFlow");
  if(!container)return;
  container.classList.add("rf-shell--knowledge","rf-shell--extraction");
  if(!root)root=createRoot(container);
  root.render(h(ExtractionFlow));
};
window.unmountExtractionReactFlow=function(){if(!root)return;root.unmount();root=null;};
