"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";
import { ModelSelector } from "@/components/model-selector";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon, VercelIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";
import { memo, useState, useRef, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { VisibilityType, VisibilitySelector } from "./visibility-selector";
import { Loader2, UploadCloud } from "lucide-react"; // ✅ Icons for UI feedback
import { useTableStore } from "@/lib/store"; // ✅ Zustand state
import TableSelector from "@/components/tableSelector"; // ✅ Client-side table selection
import { TableDropdown } from "@/components/table-dropdown";

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { selectedTable } = useTableStore(); // ✅ Zustand selected table state
  
  useEffect(() => {
    console.log("🟢 ChatHeader: Zustand Table Updated →", selectedTable);
  }, [selectedTable]);


  // ✅ Handle File Selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      console.error("❌ No file selected");
      return;
    }

    const file = event.target.files[0];
    setSelectedFile(file);
    console.log("📂 Selected File:", file.name);
  };

  // ✅ Handle File Upload
  const handleUpload = async () => {
    if (!selectedFile) {
      console.error("❌ No file selected for upload");
      alert("Please select a file first.");
      return;
    }

    console.log("📤 Uploading file:", selectedFile.name);

    const formData = new FormData();
    formData.append("csvFile", selectedFile);

    try {
      console.log("📤 Sending file to /api/files/upload...");
      setLoading(true);
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      console.log("✅ Upload Successful!");
      alert("✅ File uploaded successfully!");
    } catch (error) {
      console.error("❌ Upload error:", error);
      alert("❌ Error uploading file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="flex sticky top-0 bg-background py-2 px-3 md:px-4 items-center gap-4 border-b">
      <SidebarToggle />

      {/* ✅ New Chat Button */}
      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push("/");
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && <ModelSelector selectedModelId={selectedModelId} className="order-1 md:order-2" />}
      {!isReadonly && <VisibilitySelector chatId={chatId} selectedVisibilityType={selectedVisibilityType} className="order-1 md:order-3" />}

      <header className="flex justify-between items-center p-4 border-b">
      <TableDropdown /> 
      </header>

      

      {/* ✅ Vercel Deployment Link */}
      <Button
        className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 hidden md:flex py-1.5 px-2 h-fit md:h-[34px] order-4 md:ml-auto"
        asChild
      >
        <Link
          href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET,OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&stores=%5B%7B%22type%22:%22postgres%22%7D,%7B%22type%22:%22blob%22%7D%5D"
          target="_noblank"
        >
          <VercelIcon size={16} />
          Deploy with Vercel
        </Link>
      </Button>

      {/* ✅ File Upload */}
      <div className="flex items-center gap-3">
        {/* Hidden file input */}
        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        {/* Upload Button */}
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          variant="outline"
        >
          <UploadCloud className="mr-2" size={16} />
          {selectedFile ? selectedFile.name : "Attach CSV"}
        </Button>

        {/* Submit Button */}
        <Button
          onClick={handleUpload}
          disabled={loading}
          className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 hidden md:flex py-1.5 px-2 h-fit md:h-[34px] order-4 md:ml-auto"
        >
          {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
          {loading ? "Uploading..." : "Submit"}
        </Button>
      </div>
      
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});


// "use client";

// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useWindowSize } from "usehooks-ts";
// import { ModelSelector } from "@/components/model-selector";
// import { SidebarToggle } from "@/components/sidebar-toggle";
// import { Button } from "@/components/ui/button";
// import { PlusIcon, VercelIcon } from "./icons";
// import { useSidebar } from "./ui/sidebar";
// import { memo, useState, useRef, useEffect } from "react";
// import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
// import { VisibilityType, VisibilitySelector } from "./visibility-selector";
// import { Paperclip } from "lucide-react";
// import { Loader2, UploadCloud } from "lucide-react"; // ✅ Icons for UI feedback
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { useTableStore } from "@/lib/store"; // ✅ Import Zustand store
// import TableSelector from "@/components/tableSelector"; // ✅ Import the client-side component

// export function TableDropdown() {
//   const { selectedTable, setSelectedTable } = useTableStore(); // ✅ Zustand global state
//   const [tables, setTables] = useState<string[]>([]);

//   useEffect(() => {
//     async function fetchTables() {
//       console.log("📡 Fetching tables...");
//       try {
//         const response = await fetch("/api/database"); // ✅ Ensure API is correct
//         const data = await response.json();
//         if (data.tables) {
//           console.log("✅ Tables retrieved:", data.tables);
//           setTables(data.tables);
//         } else {
//           console.error("❌ No tables found");
//         }
//       } catch (error) {
//         console.error("❌ Error fetching tables:", error);
//       }
//     }
//     fetchTables();
//   }, []);

//   return (
//     <div className="flex items-center gap-4">

//       {tables.length > 0 ? (
//         <select
//           className="border p-2 rounded"
//           value={selectedTable || ""}
//           onChange={(e) => {
//             console.log("📌 Updating Zustand selectedTable to:", e.target.value);
//             setSelectedTable(e.target.value);
//           }}
//         >
//           <option value="">Select a Table</option>
//           {tables.map((table) => (
//             <option key={table} value={table}>
//               {table}
//             </option>
//           ))}
//         </select>
//       ) : (
//         <p>Loading tables...</p>
//       )}

//       {/* {selectedTable && (
//         <p className="ml-4">
//           Selected Table: {selectedTable}
//         </p>
//       )} */}
//     </div>
//   );
// }

// function PureChatHeader({
//   chatId,
//   selectedModelId,
//   selectedVisibilityType,
//   isReadonly,
// }: {
//   chatId: string;
//   selectedModelId: string;
//   selectedVisibilityType: VisibilityType;
//   isReadonly: boolean;
// }) {
//   const router = useRouter();
//   const { open } = useSidebar();
//   const { width: windowWidth } = useWindowSize();
//   const [file, setFile] = useState<File | null>(null);
//   const [message, setMessage] = useState("");
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [loading, setLoading] = useState(false);

//   const [tables, setTables] = useState<string[]>([]);
//   const { selectedTable, setSelectedTable } = useTableStore(); // ✅ Use Zustand global state

//   // ✅ Fetch tables from API
//   useEffect(() => {
//     async function fetchTables() {
//       console.log("📡 Fetching tables...");
//       try {
//         const response = await fetch("/api/database");
//         const data = await response.json();
//         if (data.tables) {
//           console.log("✅ Tables retrieved:", data.tables);
//           setTables(data.tables);
//         } else {
//           console.error("❌ No tables found");
//         }
//       } catch (error) {
//         console.error("❌ Error fetching tables:", error);
//       }
//     }

//     fetchTables();
//   }, []);


//   // ✅ Handle File Selection
//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (!event.target.files || event.target.files.length === 0) {
//       console.error("❌ No file selected");
//       return;
//     }

//     const file = event.target.files[0];
//     setSelectedFile(file);
//     setMessage(file.name); // ✅ Update button text to file name
//     console.log("📂 Selected File:", file.name);
//   };

//   const handleAttachClick = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     } else {
//       console.error("❌ fileInputRef is null"); // ✅ Prevents crash if ref is missing
//     }
//   };
  
//   // ✅ Handle File Upload
//   const handleUpload = async () => {
//     if (!selectedFile) {
//       console.error("❌ No file selected for upload");
//       alert("Please select a file first.");
//       return;
//     }

//     console.log("📤 Uploading file:", selectedFile.name);

//     const formData = new FormData();
//     formData.append("csvFile", selectedFile);

//     try {
//       console.log("📤 Sending file to /api/files/upload...");
//       const response = await fetch("/api/files/upload", {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("✅ Response:", data);
//       setMessage("✅ Upload Successful!");
//       alert("✅ File uploaded successfully!");
//     } catch (error) {
//       console.error("❌ Upload error:", error);
//       setMessage("❌ Upload Failed");
//       alert("❌ Error uploading file.");
//     } finally {
//       setLoading(false); // ✅ Stop loading after upload completes
//     }
//   };

//   // ✅ Trigger File Picker
//   const triggerFileSelect = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     } else {
//       console.error("❌ fileInputRef is null");
//     }
//   };

//   return (
//     <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
//       <SidebarToggle />

//       {(!open || windowWidth < 768) && (
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               variant="outline"
//               className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
//               onClick={() => {
//                 router.push("/");
//                 router.refresh();
//               }}
//             >
//               <PlusIcon />
//               <span className="md:sr-only">New Chat</span>
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent>New Chat</TooltipContent>
//         </Tooltip>
//       )}

//       {!isReadonly && <ModelSelector selectedModelId={selectedModelId} className="order-1 md:order-2" />}
//       {!isReadonly && <VisibilitySelector chatId={chatId} selectedVisibilityType={selectedVisibilityType} className="order-1 md:order-3" />}

//       {/* ✅ File Upload Button */}
//       <div className="flex gap-3">
//         {/* Hidden file input */}
//         <input
//           type="file"
//           accept=".csv"
//           ref={fileInputRef}
//           onChange={handleFileChange}
//           className="hidden"
//         />

//         {/* Upload Button */}
//         <Button
//           onClick={() => fileInputRef.current?.click()}
//           disabled={loading}
//           variant="outline"
//         >
//           <UploadCloud className="mr-2" size={16} />
//           {file ? file.name : "Attach CSV"}
//         </Button>

//         {/* Submit Button */}
//         <Button
//           onClick={handleUpload}
//           disabled={loading}
//           className="bg-blue-500 text-white hover:bg-blue-600"
//         >
//           {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
//           {loading ? "Uploading..." : "Submit"}
//         </Button>
//       </div>

//       <header className="flex items-center gap-4 p-4 border-b">
//       <h1 className="text-lg font-semibold">Database Tables</h1>

//       <TableDropdown />

//       {selectedTable && (
//         <p className="ml-4">
//           Selected Table: <strong>{selectedTable}</strong>
//         </p>
//       )}

//       <button onClick={() => console.log("🔍 Selected Table (Confirmed):", selectedTable)}>
//         Confirm Table
//       </button>
//     </header>

//     <header className="flex justify-between p-4">
//       <h1>Database Table Selector</h1>
//       <TableSelector /> {/* ✅ Client component for selecting tables */}
//     </header>
    
//       <Button
//         className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 hidden md:flex py-1.5 px-2 h-fit md:h-[34px] order-4 md:ml-auto"
//         asChild
//       >
//         <Link
//           href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET,OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&stores=%5B%7B%22type%22:%22postgres%22%7D,%7B%22type%22:%22blob%22%7D%5D"
//           target="_noblank"
//         >
//           <VercelIcon size={16} />
//           Deploy with Vercel
//         </Link>
//       </Button>
//     </header>
//   );
// }

// export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
//   return prevProps.selectedModelId === nextProps.selectedModelId;
// });
