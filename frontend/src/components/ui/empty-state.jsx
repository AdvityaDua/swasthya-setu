import React from "react";
import { Button } from "./button";
import { FileText } from "lucide-react";

export function EmptyState({
    title = "No data found",
    description = "There is no information to display at this time.",
    icon: Icon = FileText,
    action
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border border-dashed animate-in fade-in-50">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground max-w-sm mt-1 mb-6">
                {description}
            </p>
            {action && (
                <div>
                    <Button onClick={action.onClick} variant={action.variant || "default"}>
                        {action.label}
                    </Button>
                </div>
            )}
        </div>
    );
}
