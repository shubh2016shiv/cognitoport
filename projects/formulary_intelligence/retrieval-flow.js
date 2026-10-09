/* Formulary Drug Retrieval — mounted ReactFlow low-level design. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h=React.createElement;
const ICONS={
  mapping:["M7 7h10v4H7z","M7 15h10v4H7z","M12 11v4"], list:["M8 6h12","M8 12h12","M8 18h12","M4 6h.01","M4 12h.01","M4 18h.01"],
  plan:["M5 4h14v16H5z","M8 8h8","M8 12h8","M8 16h5"], branch:["M7 4v7a4 4 0 0 0 4 4h6","M7 20v-5","m14 12 3 3-3 3"],
  fan:["M12 4v5","M12 9 5 5","M12 9l-5 5","M17 14v6","M7 14v6"], pool:["M4 5h6v6H4z","M14 5h6v6h-6z","M4 15h6v4H4z","M14 15h6v4h-6z"],
  search:["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14","m16 16 4.5 4.5"], check:["M20 6 9 17l-5-5"], empty:["M5 12h14"],
  warn:["M12 3 2 20h20z","M12 9v5","M12 17h.01"], normalize:["M4 7h16","M7 12h10","M9 17h6"], merge:["M6 4v5l6 5","M18 4v5l-6 5","M12 14v6"],
  attach:["M7 7h10v4H7z","M7 15h10v4H7z","M12 11v4"], loop:["M20 7h-6a7 7 0 1 0 6 10","m17 4 3 3-3 3"], arrow:["M4 12h14","m13 7 5 5-5 5"]
};
function Icon({name}){return h("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round",strokeLinejoin:"round"},(ICONS[name]||ICONS.list).map((d,i)=>h("path",{d,key:i})));}
const HANDLES=[
  h(Handle,{type:"target",position:Position.Left,id:"left",key:"tl",className:"rf-handle"}),h(Handle,{type:"target",position:Position.Top,id:"top",key:"tt",className:"rf-handle"}),
  h(Handle,{type:"target",position:Position.Right,id:"target-right",key:"tr",className:"rf-handle"}),h(Handle,{type:"source",position:Position.Right,id:"right",key:"sr",className:"rf-handle"}),
  h(Handle,{type:"source",position:Position.Bottom,id:"bottom",key:"sb",className:"rf-handle"}),h(Handle,{type:"source",position:Position.Left,id:"source-left",key:"sl",className:"rf-handle"})
];
function StepNode({data}){return h("div",{className:`rf-node rf-node--${data.kind} is-clickable`,tabIndex:0,role:"group","aria-label":`${data.title}. Press Enter for details.`,onClick:e=>data.onOpen?.(e.currentTarget,data.id),onKeyDown:e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();data.onOpen?.(e.currentTarget,data.id);}}},...HANDLES,data.seq?h("span",{className:"rf-node-sequence"},data.seq):null,h("div",{className:"rf-node-main"},h("span",{className:"rf-node-icon"},h(Icon,{name:data.icon})),h("div",{className:"rf-node-copy"},h("p",{className:"rf-node-title"},data.title),h("p",{className:"rf-node-sub"},data.sub))));}
function LaneNode({data}){return h("div",{className:"rf-lane"},...HANDLES,h("span",{className:"rf-lane-label"},h("strong",null,data.title),h("span",{className:"rf-lane-annotation"},` — ${data.hint}`)));}
const NODE_TYPES={step:StepNode,lane:LaneNode};

const LAYOUT=[
  {id:"L1",type:"lane",x:20,y:20,w:1260,h:475,title:"Prepare concurrent retrieval",hint:"one plan-specific search job for every returned action-to-class mapping"},
  {id:"MAPPINGS",type:"step",x:55,y:68,w:360,h:82,kind:"source",icon:"mapping",seq:"01",title:"Action-to-class mappings",sub:"Validated mappings returned by Drug Class Identification."},
  {id:"ACTIONS",type:"step",x:470,y:68,w:360,h:82,kind:"source",icon:"list",title:"Extracted action records",sub:"The original actions that retrieval results must rejoin."},
  {id:"FORMULARY",type:"step",x:885,y:68,w:360,h:82,kind:"source",icon:"plan",title:"Active formulary identifier",sub:"Constrains every search to the patient's current plan."},
  {id:"HAS",type:"step",x:390,y:182,w:520,h:82,kind:"gate",icon:"branch",title:"Are any class mappings available?",sub:"An empty classification result creates no retrieval jobs."},
  {id:"UNCHANGED",type:"step",x:965,y:172,w:270,h:102,kind:"similarity",icon:"empty",title:"No → carry unchanged actions",sub:"The next phase receives no candidate drugs."},
  {id:"FANOUT",type:"step",x:390,y:294,w:520,h:82,kind:"exact",icon:"fan",seq:"02",title:"Create one retrieval job per mapping",sub:"Each job carries one action identifier, one drug class, and the active formulary."},
  {id:"POOL",type:"step",x:390,y:402,w:520,h:78,kind:"handoff",icon:"pool",seq:"03",title:"Submit jobs to a bounded worker pool",sub:"Jobs run concurrently while the pool limits simultaneous searches."},

  {id:"L2",type:"lane",x:20,y:515,w:1260,h:610,title:"Resolve each retrieval job",hint:"invalid mappings, empty searches, and service failures remain isolated per action"},
  {id:"USABLE",type:"step",x:390,y:565,w:520,h:84,kind:"gate",icon:"branch",title:"Are the action identifier and drug class usable?",sub:"Unknown or unusable mappings are not sent to the formulary index."},
  {id:"SKIP",type:"step",x:65,y:558,w:270,h:98,kind:"similarity",icon:"empty",title:"No → record skipped retrieval",sub:"Return an empty normalized result for this job."},
  {id:"SEARCH",type:"step",x:390,y:680,w:520,h:88,kind:"handoff",icon:"search",title:"Search the active formulary by drug class",sub:"Run a plan-specific similarity search for covered drug candidates."},
  {id:"FOUND",type:"step",x:50,y:808,w:340,h:145,kind:"output",icon:"check",title:"Matching drugs found",sub:"Return the candidate formulary rows for this action and class."},
  {id:"NONE",type:"step",x:430,y:808,w:340,h:145,kind:"similarity",icon:"empty",title:"No matching drugs found",sub:"Record the legitimate empty search result."},
  {id:"FAILED",type:"step",x:810,y:808,w:340,h:145,kind:"blocked",icon:"warn",title:"Retrieval failed",sub:"Record the error and return an empty candidate list."},
  {id:"NORMALIZE",type:"step",x:310,y:1000,w:680,h:90,kind:"exact",icon:"normalize",title:"Normalize the per-action retrieval result",sub:"Preserve the action identifier, drug class, candidates, and any failure information."},

  {id:"L3",type:"lane",x:20,y:1145,w:1260,h:625,title:"Rejoin completed work",hint:"completion order cannot change which action receives each result"},
  {id:"COLLECT",type:"step",x:390,y:1195,w:520,h:82,kind:"exact",icon:"merge",title:"Collect the next completed job",sub:"Read worker results as they finish, not in submission order."},
  {id:"READABLE",type:"step",x:390,y:1305,w:520,h:84,kind:"gate",icon:"branch",title:"Was the completed worker result readable?",sub:"An unexpected worker exception is traced and omitted."},
  {id:"SKIP_RESULT",type:"step",x:965,y:1298,w:270,h:98,kind:"blocked",icon:"warn",title:"No → record failure and skip result",sub:"Other completed jobs continue to rejoin normally."},
  {id:"MATCH",type:"step",x:390,y:1418,w:520,h:84,kind:"gate",icon:"branch",title:"Can its action identifier be matched?",sub:"Rejoin against the original extracted action, never completion position."},
  {id:"LEAVE",type:"step",x:65,y:1410,w:270,h:98,kind:"similarity",icon:"empty",title:"No → leave actions unchanged",sub:"An unmatched result is not attached to another action."},
  {id:"ATTACH",type:"step",x:390,y:1530,w:520,h:94,kind:"container",icon:"attach",title:"Yes → attach class and candidate map",sub:"Reduce candidate rows to formulary-entry identifier → drug name and update the action."},
  {id:"MORE",type:"step",x:390,y:1650,w:520,h:82,kind:"gate",icon:"loop",title:"Are more completed jobs waiting?",sub:"Continue until every submitted retrieval job has been handled."},

  {id:"L4",type:"lane",x:20,y:1790,w:1260,h:210,title:"Selection handoff",hint:"all successfully matched actions now carry their plan-specific candidate set"},
  {id:"GO",type:"step",x:260,y:1845,w:780,h:105,kind:"output",icon:"arrow",title:"Carry the enriched action list to Relevant Drug Selection",sub:"Each action carries its drug class and either a candidate map or an empty one."}
];
const EDGES=[
  ["map-has","MAPPINGS","HAS",{sh:"bottom",th:"top"}],["actions-has","ACTIONS","HAS",{sh:"bottom",th:"top"}],["form-has","FORMULARY","HAS",{sh:"bottom",th:"top"}],
  ["has-no","HAS","UNCHANGED",{sh:"right",th:"left",label:"No",color:"#6c766f"}],["has-yes","HAS","FANOUT",{sh:"bottom",th:"top",label:"Yes"}],["fan-pool","FANOUT","POOL",{sh:"bottom",th:"top"}],
  ["pool-usable","POOL","USABLE",{sh:"bottom",th:"top"}],["usable-no","USABLE","SKIP",{sh:"source-left",th:"target-right",label:"No",color:"#6c766f"}],["usable-yes","USABLE","SEARCH",{sh:"bottom",th:"top",label:"Yes"}],
  ["search-found","SEARCH","FOUND",{sh:"bottom",th:"top",label:"matches",color:"#2f7a4a"}],["search-none","SEARCH","NONE",{sh:"bottom",th:"top",label:"none",color:"#6c766f"}],["search-failed","SEARCH","FAILED",{sh:"bottom",th:"top",label:"failed",color:"#a2453c"}],
  ["skip-normal","SKIP","NORMALIZE",{sh:"bottom",th:"left",color:"#6c766f"}],["found-normal","FOUND","NORMALIZE",{sh:"bottom",th:"top",color:"#2f7a4a"}],["none-normal","NONE","NORMALIZE",{sh:"bottom",th:"top",color:"#6c766f"}],["fail-normal","FAILED","NORMALIZE",{sh:"bottom",th:"top",color:"#a2453c"}],
  ["normal-collect","NORMALIZE","COLLECT",{sh:"bottom",th:"top"}],["collect-readable","COLLECT","READABLE",{sh:"bottom",th:"top"}],["readable-no","READABLE","SKIP_RESULT",{sh:"right",th:"left",label:"No",color:"#a2453c"}],["readable-yes","READABLE","MATCH",{sh:"bottom",th:"top",label:"Yes"}],
  ["match-no","MATCH","LEAVE",{sh:"source-left",th:"target-right",label:"No",color:"#6c766f"}],["match-yes","MATCH","ATTACH",{sh:"bottom",th:"top",label:"Yes",color:"#2f7a4a"}],
  ["skip-more","SKIP_RESULT","MORE",{sh:"bottom",th:"target-right",color:"#a2453c"}],["leave-more","LEAVE","MORE",{sh:"bottom",th:"left",color:"#6c766f"}],["attach-more","ATTACH","MORE",{sh:"bottom",th:"top",color:"#2f7a4a"}],
  ["more-loop","MORE","COLLECT",{sh:"right",th:"target-right",label:"Yes",color:"#a9631a"}],["more-go","MORE","GO",{sh:"bottom",th:"top",label:"No",color:"#2f7a4a"}]
];
function buildElements(onOpen){const nodes=LAYOUT.map(n=>({id:n.id,type:n.type,position:{x:n.x,y:n.y},style:{width:n.w,height:n.h},data:{...n,onOpen},draggable:false,selectable:false,focusable:n.type!=="lane",zIndex:n.type==="lane"?0:3}));const edges=EDGES.map(([id,source,target,o])=>({id,source,target,sourceHandle:o.sh||"bottom",targetHandle:o.th||"top",type:"smoothstep",label:o.label,labelStyle:{fill:"#3f4a45",fontSize:11,fontWeight:700},labelBgStyle:{fill:"#f4f1e9",fillOpacity:.96},labelBgPadding:[7,4],labelBgBorderRadius:7,markerEnd:{type:MarkerType.ArrowClosed,width:15,height:15,color:o.color||"#879087"},style:{stroke:o.color||"#9aa198",strokeWidth:1.6},zIndex:4}));return {nodes,edges};}
function RetrievalFlow(){const onOpen=React.useCallback((domNode,nodeId)=>{const detail=window.DIAGRAM_STAGES?.retrieval?.details?.[nodeId];if(!detail||!domNode)return;window.showKnowledgeBubble?.(domNode.closest(".react-flow__node")||domNode,detail,{immediate:true});},[]);const {nodes,edges}=React.useMemo(()=>buildElements(onOpen),[onOpen]);return h(ReactFlow,{nodes,edges,nodeTypes:NODE_TYPES,fitView:true,fitViewOptions:{padding:.03},minZoom:.25,maxZoom:1.4,nodesDraggable:false,nodesConnectable:false,elementsSelectable:false,zoomOnScroll:true,zoomOnDoubleClick:false,proOptions:{hideAttribution:false}},h(Background,{gap:22,size:1,color:"rgba(16,22,20,.08)"}),h(Controls,{showInteractive:false}));}
let root=null;
window.mountRetrievalReactFlow=function(){const container=document.getElementById("knowledgeReactFlow");if(!container)return;container.classList.add("rf-shell--knowledge","rf-shell--retrieval");if(!root)root=createRoot(container);root.render(h(RetrievalFlow));};
window.unmountRetrievalReactFlow=function(){if(!root)return;root.unmount();root=null;};
