import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Home, ChevronRight } from "lucide-react";
import { costCenterService } from "@/services/costCenterService";
import { CostCenterHierarchy } from "@/types/costCenterTypes";
import { toast } from "sonner";

interface TreeNode {
  id: number;
  level: number;
  description: string;
  fullPath: string;
  children: TreeNode[];
}

const CostCenterHierarchyView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hierarchyData, setHierarchyData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch hierarchy data
  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        setLoading(true);
        const data = await costCenterService.getCostCenterHierarchy();
        console.log("Raw data from API:", data);

        if (data && data.length > 0) {
          // Convert flat hierarchy to tree structure
          const tree = buildTree(data);
          setHierarchyData(tree);

          // Auto-expand the first level
          const level1NodeKeys = new Set<string>();
          tree.forEach((node) => level1NodeKeys.add(`${node.level}-${node.id}`));
          setExpandedNodes(level1NodeKeys);
        } else {
          console.error("No data returned from API or empty array");
        }
      } catch (error) {
        console.error("Error fetching cost center hierarchy:", error);
        toast.error("Failed to load cost center hierarchy");
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchy();
  }, []);

  // Build tree from flat hierarchy data, accounting for level-specific IDs
  const buildTree = (flatData: CostCenterHierarchy[]): TreeNode[] => {
    // Create a map to store nodes by level and ID for quick access
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // First pass: create all node objects with composite keys
    flatData.forEach((item) => {
      // Create a composite key using level and ID
      const nodeKey = `${item.Level}-${item.ID}`;

      const node: TreeNode = {
        id: item.ID,
        level: item.Level,
        description: item.Description,
        fullPath: item.FullPath,
        children: [],
      };

      nodeMap.set(nodeKey, node);

      // Level 1 nodes have no parent, so they're root nodes
      if (item.Level === 1) {
        rootNodes.push(node);
      }
    });

    // Second pass: build parent-child relationships
    flatData.forEach((item) => {
      if (item.Level > 1 && item.ParentID !== null) {
        // Current node's key
        const nodeKey = `${item.Level}-${item.ID}`;

        // Parent's key (parent is in the previous level)
        const parentKey = `${item.Level - 1}-${item.ParentID}`;

        const parentNode = nodeMap.get(parentKey);
        const currentNode = nodeMap.get(nodeKey);

        if (parentNode && currentNode) {
          parentNode.children.push(currentNode);
        } else {
          console.error(`Failed to link nodes: Child=${nodeKey}, Parent=${parentKey}`);
        }
      }
    });

    console.log("Tree structure built:", rootNodes);
    return rootNodes;
  };

  // Toggle node expansion using composite keys (level-id)
  const toggleNode = (level: number, id: number) => {
    const nodeKey = `${level}-${id}`;

    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeKey)) {
        newSet.delete(nodeKey);
      } else {
        newSet.add(nodeKey);
      }
      return newSet;
    });
  };

  // Navigate to edit a cost center
  const handleEditNode = (level: number, id: number) => {
    navigate(`/cost-centers/edit/${level}/${id}`);
  };

  // Render a tree node and its children recursively
  const renderNode = (node: TreeNode, depth: number = 0) => {
    const nodeKey = `${node.level}-${node.id}`;
    const isExpanded = expandedNodes.has(nodeKey);
    const hasChildren = node.children.length > 0;

    return (
      <div key={nodeKey} className="pl-2">
        <div className="flex items-center py-2 hover:bg-muted/30 rounded-md px-2 cursor-pointer" onClick={() => hasChildren && toggleNode(node.level, node.id)}>
          {/* Indentation */}
          <div style={{ width: `${depth * 20}px` }} />

          {/* Expansion toggle or placeholder */}
          <div className="w-5 h-5 flex items-center justify-center mr-1">
            {hasChildren ? <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} /> : <div className="w-4" />}
          </div>

          {/* Node icon based on level */}
          <div className="h-8 w-8 flex items-center justify-center mr-2">
            <div
              className={`
              h-6 w-6 rounded-full flex items-center justify-center
              ${node.level === 1 ? "bg-blue-100 text-blue-700" : ""}
              ${node.level === 2 ? "bg-green-100 text-green-700" : ""}
              ${node.level === 3 ? "bg-amber-100 text-amber-700" : ""}
              ${node.level === 4 ? "bg-purple-100 text-purple-700" : ""}
            `}
            >
              {node.level}
            </div>
          </div>

          {/* Node description */}
          <div className="flex-1">
            <span className="font-medium">{node.description}</span>
          </div>

          {/* Edit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditNode(node.level, node.id);
            }}
          >
            Edit
          </Button>
        </div>

        {/* Render children if expanded */}
        {isExpanded && node.children.length > 0 && <div className="border-l-2 border-muted ml-4">{node.children.map((child) => renderNode(child, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/cost-centers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Cost Center Hierarchy</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Full Cost Center Structure</CardTitle>
          <CardDescription>View the complete hierarchy of cost centers in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hierarchyData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No cost centers found. Create some cost centers to see the hierarchy.</div>
          ) : (
            <div className="border rounded-md p-4">
              <div className="flex items-center mb-4">
                <Home className="h-5 w-5 mr-2 text-primary" />
                <span className="font-semibold">Cost Center Structure</span>
              </div>

              <div className="space-y-1">{hierarchyData.map((node) => renderNode(node))}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CostCenterHierarchyView;
