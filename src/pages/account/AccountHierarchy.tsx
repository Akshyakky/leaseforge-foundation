// src/pages/account/AccountHierarchy.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { accountService } from "@/services/accountService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountHierarchy as AccountHierarchyType } from "@/types/accountTypes";
import { ArrowLeft, ChevronRight, FolderTree, Plus, Eye, Edit } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { companyService } from "@/services";

interface TreeNode {
  id: number;
  name: string;
  code: string;
  level: number;
  parentId: number | null;
  isPostable: boolean;
  children: TreeNode[];
  path: string;
  isActive: boolean;
}

const AccountHierarchy = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountHierarchyType[]>([]);
  const [hierarchyTree, setHierarchyTree] = useState<TreeNode[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [activeView, setActiveView] = useState<"hierarchy" | "tree">("hierarchy");

  useEffect(() => {
    fetchCompanies();
    fetchAccountHierarchy();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      const tree = buildHierarchyTree(accounts);
      setHierarchyTree(tree);
    }
  }, [accounts]);

  const fetchCompanies = async () => {
    try {
      const companiesData = await companyService.getAllCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchAccountHierarchy = async (companyId?: number) => {
    setLoading(true);
    try {
      const data = await accountService.getAccountHierarchy(companyId);
      setAccounts(data);
    } catch (err) {
      console.error("Error fetching account hierarchy:", err);
      setError("Failed to load account hierarchy");
      toast.error("Failed to load account hierarchy");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    const companyId = value ? parseInt(value) : undefined;
    fetchAccountHierarchy(companyId);
  };

  const buildHierarchyTree = (accountsList: AccountHierarchyType[]): TreeNode[] => {
    const nodes: { [key: number]: TreeNode } = {};
    const rootNodes: TreeNode[] = [];

    // First pass: create all nodes
    accountsList.forEach((account) => {
      const node: TreeNode = {
        id: account.AccountID,
        name: account.AccountName,
        code: account.AccountCode,
        level: account.AccountLevel,
        parentId: account.ParentAccountID || null,
        isPostable: account.IsPostable,
        children: [],
        path: account.HierarchyPath,
        isActive: account.IsActive,
      };
      nodes[account.AccountID] = node;
    });

    // Second pass: build the tree structure
    Object.values(nodes).forEach((node) => {
      if (node.parentId === null) {
        rootNodes.push(node);
      } else if (nodes[node.parentId]) {
        nodes[node.parentId].children.push(node);
      }
    });

    // Sort child nodes
    const sortNodes = (nodeList: TreeNode[]): TreeNode[] => {
      return nodeList
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((node) => {
          if (node.children.length) {
            node.children = sortNodes(node.children);
          }
          return node;
        });
    };

    return sortNodes(rootNodes);
  };

  const renderTreeNode = (node: TreeNode, index: number, level: number = 0) => {
    const indent = level * 20;

    return (
      <React.Fragment key={node.id}>
        <div
          className={`flex items-center py-2 px-4 hover:bg-accent/50 border-b border-border transition-colors ${!node.isActive ? "opacity-60" : ""}`}
          style={{ paddingLeft: `${indent + 12}px` }}
        >
          <div className="flex-1 flex items-center">
            {node.children.length > 0 && <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />}
            <span className="font-mono text-sm text-muted-foreground mr-2">{node.code}</span>
            <span className={`text-foreground ${!node.isPostable ? "italic text-muted-foreground" : ""}`}>{node.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/accounts/${node.id}`)} title="View Account" className="hover:bg-accent hover:text-accent-foreground">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/accounts/edit/${node.id}`)} title="Edit Account" className="hover:bg-accent hover:text-accent-foreground">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {node.children.map((child, idx) => renderTreeNode(child, idx, level + 1))}
      </React.Fragment>
    );
  };

  const renderIndentedList = () => {
    return (
      <div className="border border-border rounded-md overflow-hidden bg-card">
        <div className="bg-muted py-2 px-4 font-medium border-b border-border flex items-center">
          <div className="flex-1 text-foreground">Account</div>
          <div className="text-foreground">Actions</div>
        </div>
        <div className="max-h-[600px] overflow-y-auto bg-card">{hierarchyTree.map((node, index) => renderTreeNode(node, index))}</div>
      </div>
    );
  };

  const renderHierarchyView = () => {
    const renderHierarchyItem = (account: AccountHierarchyType) => {
      return (
        <div key={account.AccountID} className="py-3 px-4 border-b border-border hover:bg-accent/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <div className="font-mono text-sm text-muted-foreground mr-3 mt-0.5">{account.AccountCode}</div>
              <div>
                <div className={`font-medium ${!account.IsActive ? "text-muted-foreground/60" : "text-foreground"}`}>{account.AccountName}</div>
                <div className="text-sm text-muted-foreground mt-1">{account.HierarchyName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/accounts/${account.AccountID}`)}
                title="View Account"
                className="hover:bg-accent hover:text-accent-foreground"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/accounts/edit/${account.AccountID}`)}
                title="Edit Account"
                className="hover:bg-accent hover:text-accent-foreground"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="border border-border rounded-md overflow-hidden bg-card">
        <div className="bg-muted py-2 px-4 font-medium border-b border-border text-foreground">Hierarchical View</div>
        <div className="max-h-[600px] overflow-y-auto bg-card">{accounts.map((account) => renderHierarchyItem(account))}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">{error}</p>
        <Button className="mt-4" onClick={() => navigate("/accounts")}>
          Back to Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/accounts")} className="hover:bg-accent hover:text-accent-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Account Hierarchy</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.CompanyID} value={company.CompanyID.toString()}>
                  {company.CompanyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => navigate("/accounts/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chart of Accounts</CardTitle>
          <CardDescription>View your accounts in hierarchical structure</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
                <TabsTrigger value="tree">Tree View</TabsTrigger>
              </TabsList>
              <div className="text-sm text-muted-foreground">Total Accounts: {accounts.length}</div>
            </div>

            <TabsContent value="hierarchy">{renderHierarchyView()}</TabsContent>
            <TabsContent value="tree">{renderIndentedList()}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountHierarchy;
