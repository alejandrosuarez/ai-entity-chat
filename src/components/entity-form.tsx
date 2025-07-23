'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  createEntityAction,
  getCategoriesAction,
  uploadEntityImagesAction,
} from '@/lib/actions'
import { useToast } from '@/hooks/use-toast'
import { type Category } from '@/lib/api'

interface EntityFormProps {
  onSuccess: () => void
  onBack: () => void
}

interface DynamicFieldConfig {
  key: string
  type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select'
  label: string
  required?: boolean
  placeholder?: string
  options?: string[]
}

export function EntityForm({ onSuccess, onBack }: EntityFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  )
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    public_shareable: true,
  })
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({})
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [isPending, startTransition] = useTransition()
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const result = await getCategoriesAction()
      if (result) {
        const activeCategories = result.categories.filter((cat) => cat.active)
        setCategories(activeCategories)
      } else {
        toast({
          title: 'Warning',
          description: 'Could not load categories. Using default options.',
          variant: 'default',
        })
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      toast({
        title: 'Warning',
        description: 'Could not load categories. Using default options.',
        variant: 'default',
      })
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const handleCategoryChange = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName)
    setSelectedCategory(category || null)
    setFormData((prev) => ({ ...prev, category: categoryName }))

    // Reset dynamic fields when category changes
    setDynamicFields({})
  }

  const getDynamicFieldsConfig = (): DynamicFieldConfig[] => {
    if (!selectedCategory?.base_schema || typeof selectedCategory.base_schema !== 'object') {
      return []
    }

    // Handle the actual API format where base_schema is a simple object with keys
    const dynamicFields = Object.keys(selectedCategory.base_schema).map(
      (key: string) => {
        // Determine field type based on key name patterns
        let fieldType: DynamicFieldConfig['type'] = 'text'
        
        if (key.toLowerCase().includes('price') || key.toLowerCase().includes('year') || 
            key.toLowerCase().includes('sqft') || key.toLowerCase().includes('mileage') ||
            key.toLowerCase().includes('bedroom') || key.toLowerCase().includes('bathroom')) {
          fieldType = 'number'
        } else if (key.toLowerCase().includes('email')) {
          fieldType = 'email'
        } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('website')) {
          fieldType = 'url'
        } else if (key.toLowerCase().includes('description') || key.toLowerCase().includes('address')) {
          fieldType = 'textarea'
        }
        
        return {
          key,
          type: fieldType,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          required: false, // Since the API doesn't specify required fields, make them optional
          placeholder: `Enter ${key.replace(/_/g, ' ').toLowerCase()}`,
          options: undefined,
        }
      }
    )
    
    return dynamicFields
  }

  const handleDynamicFieldChange = (key: string, value: any) => {
    setDynamicFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []

    // Configuration
    const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB per file to stay well under server limit
    const MAX_TOTAL_SIZE = 5 * 1024 * 1024 // 5MB total for all files
    const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const MAX_FILES = 5 // Maximum number of files

    // Check if adding these files would exceed the maximum number
    if (selectedImages.length + files.length > MAX_FILES) {
      toast({
        title: 'Too Many Files',
        description: `You can only upload up to ${MAX_FILES} images. You currently have ${selectedImages.length} selected.`,
        variant: 'destructive',
      })
      e.target.value = '' // Clear the input
      return
    }

    files.forEach((file) => {
      // Check file format
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        errors.push(`${file.name}: Unsupported format. Please use JPEG, PNG, WebP, or GIF.`)
        return
      }

      // Check individual file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
        errors.push(`${file.name}: File too large (${sizeMB}MB). Maximum size is 2MB per file.`)
        return
      }

      validFiles.push(file)
    })

    // Check total size including existing files
    const currentTotalSize = selectedImages.reduce((sum, file) => sum + file.size, 0)
    const newTotalSize = validFiles.reduce((sum, file) => sum + file.size, 0)
    const totalSize = currentTotalSize + newTotalSize

    if (totalSize > MAX_TOTAL_SIZE) {
      const totalMB = (totalSize / (1024 * 1024)).toFixed(2)
      errors.push(`Total file size would be ${totalMB}MB. Maximum total size is 5MB.`)
    } else if (validFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...validFiles])
    }

    // Show errors if any
    if (errors.length > 0) {
      toast({
        title: 'Image Upload Issues',
        description: errors.slice(0, 2).join(' '), // Show first 2 errors to avoid too long message
        variant: 'destructive',
      })
    }

    // Clear the input so user can select the same files again if needed
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const validateDynamicFields = (): boolean => {
    const requiredFields = getDynamicFieldsConfig().filter(
      (field) => field.required
    )
    for (const field of requiredFields) {
      if (!dynamicFields[field.key]) {
        toast({
          title: 'Missing Information',
          description: `Please fill in the required field: ${field.label}`,
          variant: 'destructive',
        })
        return false
      }
    }
    return true
  }

  const convertFieldValue = (key: string, value: any, fieldType: string) => {
    if (!value || value === '') return value
    
    switch (fieldType) {
      case 'number':
        return Number(value)
      case 'integer':
        return parseInt(value, 10)
      default:
        return value
    }
  }

  const processAttributes = () => {
    const processed: Record<string, any> = {}
    const fieldsConfig = getDynamicFieldsConfig()
    
    for (const field of fieldsConfig) {
      if (dynamicFields[field.key] !== undefined && dynamicFields[field.key] !== '') {
        // Convert based on the field type we determined
        let convertedValue = dynamicFields[field.key]
        if (field.type === 'number') {
          convertedValue = Number(dynamicFields[field.key])
        }
        processed[field.key] = convertedValue
      }
    }
    
    return processed
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.name.trim() ||
      !formData.category.trim() ||
      !formData.description.trim()
    ) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    if (!validateDynamicFields()) {
      return
    }

    startTransition(async () => {
      try {
        // Create entity with attributes
        const processedAttributes = processAttributes()
        const entityData = {
          name: formData.name.trim(),
          entity_type: formData.category.trim(),
          description: formData.description.trim(),
          attributes: processedAttributes,
          public_shareable: formData.public_shareable,
          tenantId: 'default', // You might want to get this from auth context
        }

        console.log('Creating entity with data:', entityData)
        console.log('Selected category schema:', selectedCategory?.base_schema)
        
        const result = await createEntityAction(entityData)

        if (result) {
          // Upload images if any are selected
          if (selectedImages.length > 0) {
            const imageFormData = new FormData()
            selectedImages.forEach((file) =>
              imageFormData.append('files', file)
            )
            imageFormData.append('label', 'entity-image')

            const imageResult = await uploadEntityImagesAction(
              result.id,
              imageFormData
            )
            if (!imageResult?.success) {
              toast({
                title: 'Warning',
                description:
                  'Entity created but image upload failed. You can add images later.',
                variant: 'default',
              })
            }
          }

          toast({
            title: 'Success!',
            description: `Entity "${result.name}" has been created successfully${selectedImages.length > 0 ? ' with images' : ''}.`,
          })

          // Reset form
          setFormData({
            name: '',
            category: '',
            description: '',
            public_shareable: true,
          })
          setDynamicFields({})
          setSelectedImages([])
          setSelectedCategory(null)
          if (fileInputRef.current) fileInputRef.current.value = ''

          onSuccess()
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create entity. Please try again.',
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('Entity creation error:', error)
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        })
      }
    })
  }

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }))
    }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Entity</CardTitle>
        <p className="text-sm text-muted-foreground">
          Fill in the details for your new entity
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter entity name"
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            {isLoadingCategories ? (
              <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm items-center">
                <span className="text-muted-foreground">
                  Loading categories...
                </span>
              </div>
            ) : (
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={isPending}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category...</option>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.display_name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="person">Person</option>
                    <option value="place">Place</option>
                    <option value="thing">Thing</option>
                    <option value="organization">Organization</option>
                    <option value="event">Event</option>
                    <option value="concept">Concept</option>
                  </>
                )}
              </select>
            )}
            {selectedCategory && (
              <p className="text-xs text-muted-foreground">
                {selectedCategory.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleInputChange('description')}
              disabled={isPending}
              required
            />
          </div>

          {/* Dynamic Fields based on Category */}
          {getDynamicFieldsConfig().map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.type === 'select' ? (
                <select
                  id={field.key}
                  value={dynamicFields[field.key] || ''}
                  onChange={(e) =>
                    handleDynamicFieldChange(field.key, e.target.value)
                  }
                  disabled={isPending}
                  required={field.required}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={field.key}
                  placeholder={field.placeholder}
                  value={dynamicFields[field.key] || ''}
                  onChange={(e) =>
                    handleDynamicFieldChange(field.key, e.target.value)
                  }
                  disabled={isPending}
                  required={field.required}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              ) : (
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={dynamicFields[field.key] || ''}
                  onChange={(e) =>
                    handleDynamicFieldChange(field.key, e.target.value)
                  }
                  disabled={isPending}
                  required={field.required}
                />
              )}
            </div>
          ))}

          {/* Image Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="images">Images (optional)</Label>
              <span className="text-xs text-muted-foreground">
                {selectedImages.length}/5 files | {((selectedImages.reduce((sum, file) => sum + file.size, 0)) / (1024 * 1024)).toFixed(1)}MB/5MB
              </span>
            </div>
            {selectedImages.length > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${Math.min(100, (selectedImages.reduce((sum, file) => sum + file.size, 0) / (5 * 1024 * 1024)) * 100)}%` 
                  }}
                ></div>
              </div>
            )}
            <input
              ref={fileInputRef}
              id="images"
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleImageSelect}
              disabled={isPending}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: JPEG, PNG, WebP, GIF • Max 2MB per file • Max 5 files total
            </p>
            {selectedImages.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {selectedImages.length} image
                  {selectedImages.length > 1 ? 's' : ''} selected:
                </p>
                <div className="space-y-1">
                  {selectedImages.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-xs truncate flex-1">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        onClick={() => removeImage(index)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Public Sharing Toggle */}
          <div className="flex items-center space-x-2">
            <input
              id="public_shareable"
              type="checkbox"
              checked={formData.public_shareable}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  public_shareable: e.target.checked,
                }))
              }
              disabled={isPending}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
            />
            <Label htmlFor="public_shareable" className="text-sm font-normal">
              Make this entity publicly shareable
            </Label>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isPending}
              className="flex-1"
            >
              Back
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Creating...' : 'Create Entity'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
