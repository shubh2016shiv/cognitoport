/* Drug Class Identification — mounted ReactFlow low-level design. */
import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from "@xyflow/react";

const h = React.createElement;
const ICONS = {
  actions:["M8 6h12","M8 12h12","M8 18h12","M4 6h.01","M4 12h.01","M4 18h.01"],
  branch:["M7 4v7a4 4 0 0 0 4 4h6","M7 20v-5","m14 12 3 3-3 3"],
  prompt:["M5 4h14v16H5z","M8 8h8","M8 12h8","M8 16h5"],
  format:["M4 6h16","M7 10h10","M7 14h10","M4 18h16"],
  model:["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6","M12 3v6","M12 15v6","M3 12h6","M15 12h6","M6 6l3 3","M15 15l3 3","M18 6l-3 3","M9 15l-3 3"],
  validate:["M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z","m9 12 2 2 4-5"],
  retry:["M20 7h-6a7 7 0 1 0 6 10","m17 4 3 3-3 3"],
  clear:["M4 7h16","M9 7V4h6v3","M8 11v7","M12 11v7","M16 11v7"],
  empty:["M5 12h14"],
  stop:["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18","m6 6 12 12"],
  pair:["M7 7h10v4H7z","M7 15h10v4H7z","M12 11v4"],
  arrow:["M4 12h14","m13 7 5 5-5 5"]
};
function Icon({name}) { return h("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round",strokeLinejoin:"round"},(ICONS[name]||ICONS.actions).map((d,i)=>h("path",{d,key:i}))); }

const HANDLES=[
  h(Handle,{type:"target",position:Position.Left,id:"left",key:"tl",className:"rf-handle"}),
  h(Handle,{type:"target",position:Position.Top,id:"top",key:"tt",className:"rf-handle"}),
  h(Handle,{type:"target",position:Position.Right,id:"target-right",key:"tr",className:"rf-handle"}),
  h(Handle,{type:"source",position:Position.Right,id:"right",key:"sr",className:"rf-handle"}),
  h(Handle,{type:"source",position:Position.Bottom,id:"bottom",key:"sb",className:"rf-handle"}),
  h(Handle,{type:"source",position:Position.Left,id:"source-left",key:"sl",className:"rf-handle"})
];
function StepNode({data}) { return h("div",{
    className:`rf-node rf-node--${data.kind} is-clickable`,tabIndex:0,role:"group",
    "aria-label":`${data.title}. Press Enter for details.`,
    onClick:e=>data.onOpen?.(e.currentTarget,data.id),
    onKeyDown:e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();data.onOpen?.(e.currentTarget,data.id);}}
  },...HANDLES,data.seq?h("span",{className:"rf-node-sequence"},data.seq):null,
  h("div",{className:"rf-node-main"},h("span",{className:"rf-node-icon"},h(Icon,{name:data.icon})),h("div",{className:"rf-node-copy"},h("p",{className:"rf-node-title"},data.title),h("p",{className:"rf-node-sub"},data.sub)))); }
function LaneNode({data}) { return h("div",{className:"rf-lane"},...HANDLES,h("span",{className:"rf-lane-label"},h("strong",null,data.title),h("span",{className:"rf-lane-annotation"},` — ${data.hint}`))); }
const NODE_TYPES={step:StepNode,lane:LaneNode};

const LAYOUT=[
  {id:"L1",type:"lane",x:20,y:20,w:1260,h:510,title:"Prepare class identification",hint:"resolve the versioned instruction before invoking the model"},
  {id:"ACTIONS",type:"step",x:390,y:68,w:520,h:82,kind:"source",icon:"actions",seq:"01",title:"Extracted pharmacological actions",sub:"Each action arrives with its preserved identifier and action name."},
  {id:"HAS_ACTIONS",type:"step",x:390,y:178,w:520,h:82,kind:"gate",icon:"branch",title:"Are any extracted actions available?",sub:"This safeguard avoids a model call when there is nothing to classify."},
  {id:"EMPTY_INPUT",type:"step",x:965,y:168,w:270,h:102,kind:"similarity",icon:"empty",title:"No → return an empty classification list",sub:"The retrieval phase receives no drug classes to search."},
  {id:"PROMPT",type:"step",x:390,y:292,w:520,h:86,kind:"handoff",icon:"prompt",seq:"02",title:"Request the versioned drug-class prompt",sub:"Resolve the system and user instructions used for this classification call."},
  {id:"PROMPT_GATE",type:"step",x:390,y:410,w:520,h:82,kind:"gate",icon:"branch",title:"Was the prompt retrieved?",sub:"Prompt retrieval is outside the classification retry loop."},
  {id:"STOP_PROMPT",type:"step",x:965,y:400,w:270,h:102,kind:"blocked",icon:"stop",title:"No → stop formulary processing",sub:"The wider formulary operation returns its default result."},

  {id:"L2",type:"lane",x:20,y:550,w:1260,h:660,title:"Identify and validate drug classes",hint:"one structured call covers the complete action list"},
  {id:"FORMAT",type:"step",x:390,y:602,w:520,h:82,kind:"exact",icon:"format",seq:"03",title:"Insert all extracted actions into the prompt",sub:"Render the action list as one classification request."},
  {id:"MODEL",type:"step",x:390,y:714,w:520,h:92,kind:"reason",icon:"model",seq:"04",title:"Request structured drug-class identification",sub:"The model must return action-to-class pairs in the declared response shape."},
  {id:"VALID",type:"step",x:390,y:838,w:520,h:88,kind:"gate",icon:"validate",title:"Did the call return the expected structured response?",sub:"The response container and every returned pair must satisfy the schema."},
  {id:"FAILED",type:"step",x:965,y:830,w:270,h:92,kind:"blocked",icon:"stop",title:"No → record the failed attempt",sub:"Model, parsing, type, and validation failures enter the same path."},
  {id:"RETRY",type:"step",x:965,y:954,w:270,h:88,kind:"gate",icon:"retry",title:"Are attempts remaining?",sub:"Retry is bounded; failures are not retried indefinitely."},
  {id:"CLEAR",type:"step",x:965,y:1072,w:270,h:94,kind:"exact",icon:"clear",title:"Yes → clear partial attempt output",sub:"Retry the complete action list from a clean state."},
  {id:"EMPTY_FAILURE",type:"step",x:60,y:1090,w:280,h:104,kind:"similarity",icon:"empty",title:"No → return an empty class list",sub:"Retry exhaustion degrades safely instead of raising to the caller."},
  {id:"READ_PAIRS",type:"step",x:390,y:966,w:520,h:92,kind:"container",icon:"pair",title:"Yes → read returned action-to-class pairs",sub:"Each returned item contains a non-empty action identifier and drug class."},

  {id:"L3",type:"lane",x:20,y:1230,w:1260,h:330,title:"Choose the retrieval handoff",hint:"structural success can still contain zero mappings"},
  {id:"ANY",type:"step",x:390,y:1282,w:520,h:84,kind:"gate",icon:"branch",title:"Were any class mappings returned?",sub:"The schema permits a structurally valid but empty result list."},
  {id:"EMPTY_VALID",type:"step",x:90,y:1408,w:470,h:106,kind:"similarity",icon:"empty",title:"No → carry an empty class list",sub:"Formulary retrieval continues with no class searches to perform."},
  {id:"GO",type:"step",x:740,y:1408,w:470,h:106,kind:"output",icon:"arrow",title:"Yes → carry validated mappings to retrieval",sub:"Pass each returned action identifier and drug class to the next phase."}
];

const EDGES=[
  ["actions-gate","ACTIONS","HAS_ACTIONS",{sh:"bottom",th:"top"}],
  ["actions-no","HAS_ACTIONS","EMPTY_INPUT",{sh:"right",th:"left",label:"No",color:"#6c766f"}],
  ["actions-yes","HAS_ACTIONS","PROMPT",{sh:"bottom",th:"top",label:"Yes"}],
  ["prompt-gate","PROMPT","PROMPT_GATE",{sh:"bottom",th:"top"}],
  ["prompt-no","PROMPT_GATE","STOP_PROMPT",{sh:"right",th:"left",label:"No",color:"#a2453c"}],
  ["prompt-yes","PROMPT_GATE","FORMAT",{sh:"bottom",th:"top",label:"Yes",color:"#2f7a4a"}],
  ["format-model","FORMAT","MODEL",{sh:"bottom",th:"top"}],
  ["model-valid","MODEL","VALID",{sh:"bottom",th:"top"}],
  ["valid-no","VALID","FAILED",{sh:"right",th:"left",label:"No",color:"#a2453c"}],
  ["failed-retry","FAILED","RETRY",{sh:"bottom",th:"top",color:"#a2453c"}],
  ["retry-yes","RETRY","CLEAR",{sh:"bottom",th:"top",label:"Yes",color:"#a9631a"}],
  ["clear-model","CLEAR","MODEL",{sh:"right",th:"target-right",color:"#a9631a"}],
  ["retry-no","RETRY","EMPTY_FAILURE",{sh:"bottom",th:"target-right",label:"No",color:"#6c766f"}],
  ["valid-yes","VALID","READ_PAIRS",{sh:"bottom",th:"top",label:"Yes",color:"#2f7a4a"}],
  ["pairs-any","READ_PAIRS","ANY",{sh:"bottom",th:"top"}],
  ["any-no","ANY","EMPTY_VALID",{sh:"bottom",th:"top",label:"No",color:"#6c766f"}],
  ["any-yes","ANY","GO",{sh:"bottom",th:"top",label:"Yes",color:"#2f7a4a"}]
];

function buildElements(onOpen){
  const nodes=LAYOUT.map(n=>({id:n.id,type:n.type,position:{x:n.x,y:n.y},style:{width:n.w,height:n.h},data:{...n,onOpen},draggable:false,selectable:false,focusable:n.type!=="lane",zIndex:n.type==="lane"?0:3}));
  const edges=EDGES.map(([id,source,target,o])=>({id,source,target,sourceHandle:o.sh||"bottom",targetHandle:o.th||"top",type:"smoothstep",label:o.label,labelStyle:{fill:"#3f4a45",fontSize:11,fontWeight:700},labelBgStyle:{fill:"#f4f1e9",fillOpacity:.96},labelBgPadding:[7,4],labelBgBorderRadius:7,markerEnd:{type:MarkerType.ArrowClosed,width:15,height:15,color:o.color||"#879087"},style:{stroke:o.color||"#9aa198",strokeWidth:1.6},zIndex:4}));
  return {nodes,edges};
}
function ClassificationFlow(){
  const onOpen=React.useCallback((domNode,nodeId)=>{const detail=window.DIAGRAM_STAGES?.classification?.details?.[nodeId];if(!detail||!domNode)return;window.showKnowledgeBubble?.(domNode.closest(".react-flow__node")||domNode,detail,{immediate:true});},[]);
  const {nodes,edges}=React.useMemo(()=>buildElements(onOpen),[onOpen]);
  return h(ReactFlow,{nodes,edges,nodeTypes:NODE_TYPES,fitView:true,fitViewOptions:{padding:.035},minZoom:.3,maxZoom:1.4,nodesDraggable:false,nodesConnectable:false,elementsSelectable:false,zoomOnScroll:true,zoomOnDoubleClick:false,proOptions:{hideAttribution:false}},h(Background,{gap:22,size:1,color:"rgba(16,22,20,.08)"}),h(Controls,{showInteractive:false}));
}

let root=null;
window.mountClassificationReactFlow=function(){const container=document.getElementById("knowledgeReactFlow");if(!container)return;container.classList.add("rf-shell--knowledge","rf-shell--classification");if(!root)root=createRoot(container);root.render(h(ClassificationFlow));};
window.unmountClassificationReactFlow=function(){if(!root)return;root.unmount();root=null;};
