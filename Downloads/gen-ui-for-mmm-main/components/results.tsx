import { Result } from "@/lib/types";
import { DynamicChart } from "./dynamic-chart";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "./ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { BotIcon, UserIcon } from "@/components/custom/icons";
import { MoreHorizontal, ChevronUp, ChevronDown } from "lucide-react"; // (...) Button

export const Results = ({
  messages,
  toggleTableVisibility, // Receive the function
}: {
  messages: { 
    role: "user" | "bot"; 
    content: any; 
    results: Result[];
    chartConfig?: null;
    type?: "text" | "chart" | "table"; 
    isTableVisible?: boolean }[];
  toggleTableVisibility: (index: number) => void;
}) => {

  return (
    <motion.div
      className="flex flex-col gap-4 px-4 w-full md:px-0 first-of-type:pt-10"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >

      {/* // Loop through all messages */}
      {messages.map((message, index) => (

      <div key={index} className="flex flex-col gap-2">
      {/* User Message */}
      {message.role === "user" && (
        <div className="flex flex-row gap-4 items-center">
          <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
            <UserIcon />
          </div>
          <div className="text-foreground bg-muted p-3 rounded-lg max-w-[75%] shadow-sm">
            {message.content}
          </div>
        </div>
      )}

      {/* Bot Response */}
      {message.role === "bot" && message.type === "text" && (
      <div className="flex flex-row gap-4 items-center justify-end w-full">
        <div className="text-foreground bg-primary/10 p-3 rounded-lg max-w-[75%] shadow-sm">
          {message.content}
        </div>
        <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
          <BotIcon />
        </div>        
      </div>
      )}

      {/* Show chart */}
      {message.type === "chart" && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <DynamicChart 
            chartData={message.content.chartData} 
            chartConfig={message.content.chartConfig} 
          />
        </div>
      )}

      {/* Show table */}
      {message.type === "table" && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Data Table</h3>
            <button 
              onClick={() => toggleTableVisibility(index)}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400"
            >
              {message.isTableVisible ? (
                <>
                  <ChevronUp size={16} />
                  Hide Table
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  Show Table
                </>
              )}
            </button>
          </div>
          
          <AnimatePresence>
            {message.isTableVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {/* Display SQL Query - MOVED HERE */}
                {message.content.sqlQuery && (
                  <div className="mb-4 p-3 bg-gray-200 dark:bg-gray-700 rounded-md font-mono text-sm overflow-x-auto">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">SQL Query:</div>
                    <code>{message.content.sqlQuery}</code>
                  </div>
                )}
                
                <Table className="min-w-full divide-y divide-border">
                  <TableHeader className="bg-secondary sticky top-0 shadow-sm">
                    <TableRow>
                      {message.content.columns.map((column: string, colIndex: number) => (
                        <TableHead key={colIndex} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-card divide-y divide-border">
                    {message.content.results.map((row: any, rowIndex: number) => (
                      <TableRow key={rowIndex} className="hover:bg-muted">
                        {message.content.columns.map((column: string, cellIndex: number) => (
                          <TableCell key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {row[column] instanceof Date ? row[column].toLocaleDateString() : String(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      </div>
      ))}
    </motion.div>

  );
};

