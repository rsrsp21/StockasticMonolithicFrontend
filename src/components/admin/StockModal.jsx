import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Plus, Edit, Loader2 } from "lucide-react";
import { StockFormFields } from "./StockFormFields";

export function StockModal({
    open,
    onOpenChange,
    mode, // 'add' or 'edit'
    formData,
    setFormData,
    imagePreview,
    onImageUpload,
    onImageRemove,
    onSubmit,
    isSubmitting,
}) {
    const isAddMode = mode === "add";
    const Icon = isAddMode ? Plus : Edit;
    const title = isAddMode ? "Add New Stock" : "Edit Stock";
    const description = isAddMode
        ? "Fill in the details to list a new stock"
        : "Update the stock information below";
    const submitText = isAddMode ? "Add Stock" : "Save Changes";
    const submittingText = isAddMode ? "Adding..." : "Updating...";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <StockFormFields
                        formData={formData}
                        setFormData={setFormData}
                        imagePreview={imagePreview}
                        onImageUpload={onImageUpload}
                        onImageRemove={onImageRemove}
                    />
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button onClick={onSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                {submittingText}
                            </>
                        ) : (
                            submitText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
