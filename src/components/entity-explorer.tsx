'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Filter, X } from 'lucide-react'
import { getCategoriesAction, searchEntitiesAction } from '@/lib/actions'
import { useToast } from '@/hooks/use-toast'
import { type Category, type SearchEntity, type SearchParams, type FilterMetadata } from '@/lib/api'
import { EntityDetailModal } from './entity-detail-modal'

interface EntityExplorerProps {
  onBack: () => void
}

export function EntityExplorer({ onBack }: EntityExplorerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [entities, setEntities] = useState<SearchEntity[]>([])
  const [allEntities, setAllEntities] = useState<SearchEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({})
  const [availableFilters, setAvailableFilters] = useState<FilterMetadata>({})
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    has_more: false
  })
  const [selectedEntity, setSelectedEntity] = useState<SearchEntity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      searchEntities()
    }
  }, [selectedCategory])

  const loadCategories = async () => {
    try {
      const response = await getCategoriesAction()
      if (response?.categories) {
        setCategories(response.categories)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      })
    }
  }

  const generateFiltersFromData = (entities: SearchEntity[], categorySchema?: any) => {
    const filters: FilterMetadata = {}
    
    if (!entities || entities.length === 0) return filters

    // Collect all attribute keys and their values
    const attributeValues: Record<string, Set<any>> = {}
    const numericAttributes: Record<string, { min: number; max: number; values: number[] }> = {}

    entities.forEach(entity => {
      if (entity.attributes) {
        Object.entries(entity.attributes).forEach(([key, value]) => {
          // Filter out null, undefined, empty strings, and whitespace-only strings
          if (value !== null && value !== undefined && String(value).trim() !== '') {
            const cleanValue = String(value).trim()
            
            // Initialize sets if not exists
            if (!attributeValues[key]) {
              attributeValues[key] = new Set()
            }
            
            attributeValues[key].add(cleanValue)
            
            // Check if it's numeric (but not if it looks like mixed text/numbers)
            const numValue = typeof value === 'number' ? value : parseFloat(cleanValue)
            if (!isNaN(numValue) && isFinite(numValue) && !/[a-zA-Z]/.test(cleanValue)) {
              if (!numericAttributes[key]) {
                numericAttributes[key] = { min: numValue, max: numValue, values: [] }
              }
              numericAttributes[key].values.push(numValue)
              numericAttributes[key].min = Math.min(numericAttributes[key].min, numValue)
              numericAttributes[key].max = Math.max(numericAttributes[key].max, numValue)
            }
          }
        })
      }
    })

    // Generate filters based on data analysis
    Object.entries(attributeValues).forEach(([key, valueSet]) => {
      const values = Array.from(valueSet)
      const isNumeric = numericAttributes[key] && numericAttributes[key].values.length === values.length
      
      if (isNumeric && numericAttributes[key].max > numericAttributes[key].min) {
        // Create range filter for numeric data with variation
        filters[key] = {
          type: 'range',
          min: numericAttributes[key].min,
          max: numericAttributes[key].max
        }
      } else if (values.length > 1 && values.length <= 10) {
        // Create select filter for categorical data with reasonable options
        const validOptions = values
          .map(v => String(v).trim())
          .filter(v => v.length > 0) // Remove empty strings
          .sort()
        
        if (validOptions.length > 1) {
          console.log(`Creating select filter for ${key}:`, validOptions)
          filters[key] = {
            type: 'select',
            options: validOptions
          }
        }
      }
      // Skip attributes with only 1 unique value or too many options (>10)
    })

    return filters
  }

  const searchEntities = async () => {
    if (!selectedCategory) return

    setLoading(true)
    try {
      const searchParams: SearchParams = {
        category: selectedCategory,
        q: searchQuery || undefined,
        filters: Object.keys(currentFilters).length > 0 ? currentFilters : undefined,
        page: pagination.page,
        limit: pagination.limit,
        include_images: true
      }

      const response = await searchEntitiesAction(searchParams)
      if (response) {
        setEntities(response.entities)
        setPagination(response.pagination)
        
        // Generate filters from entity data and category schema
        const selectedCategoryData = categories.find(cat => cat.name === selectedCategory)
        const generatedFilters = generateFiltersFromData(response.entities, selectedCategoryData?.base_schema)
        
        console.log('Generated filters from entity data:', generatedFilters)
        setAvailableFilters(generatedFilters)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search entities',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    searchEntities()
  }

  const handleFilterChange = (filterKey: string, value: any) => {
    setCurrentFilters(prev => {
      const newFilters = { ...prev }
      if (value === '__all__' || value === '') {
        // Remove filter if "All" is selected
        delete newFilters[filterKey]
      } else {
        newFilters[filterKey] = value
      }
      return newFilters
    })
  }

  const handleRangeFilterChange = (filterKey: string, type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined
    setCurrentFilters(prev => ({
      ...prev,
      [filterKey]: {
        ...((prev[filterKey] as any) || {}),
        [type]: numValue
      }
    }))
  }

  const removeFilter = (filterKey: string) => {
    setCurrentFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[filterKey]
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setCurrentFilters({})
    setSearchQuery('')
    setPagination(prev => ({ ...prev, page: 1 }))
    searchEntities()
  }

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    searchEntities()
  }

  const renderFilterInputs = () => {
    return Object.entries(availableFilters).map(([key, filter]) => {
      if (filter.type === 'range') {
        const currentRange = currentFilters[key] as { min?: number; max?: number } || {}
        return (
          <div key={key} className="space-y-2">
            <Label className="text-sm font-medium capitalize">{key.replace('_', ' ')}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={`Min ${filter.min || ''}`}
                type="number"
                value={currentRange.min || ''}
                onChange={(e) => handleRangeFilterChange(key, 'min', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder={`Max ${filter.max || ''}`}
                type="number"
                value={currentRange.max || ''}
                onChange={(e) => handleRangeFilterChange(key, 'max', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        )
      } else if (filter.type === 'select' && filter.options) {
        return (
          <div key={key} className="space-y-2">
            <Label className="text-sm font-medium capitalize">{key.replace('_', ' ')}</Label>
            <Select value={currentFilters[key] || '__all__'} onValueChange={(value) => handleFilterChange(key, value)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${key}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__" key="all-option">All</SelectItem>
                {filter.options
                  .filter(option => {
                    const isValid = option && String(option).trim().length > 0
                    if (!isValid) {
                      console.warn(`Filtered out invalid option for ${key}:`, option)
                    }
                    return isValid
                  })
                  .map((option, index) => {
                    const optionStr = String(option).trim()
                    const uniqueKey = `${key}-${optionStr}-${index}`
                    
                    // Final safety check
                    if (!optionStr || optionStr.length === 0) {
                      console.error(`Empty option detected for ${key}:`, { option, optionStr, index })
                      return null
                    }
                    
                    console.log(`Rendering SelectItem for ${key}:`, { option: optionStr, key: uniqueKey })
                    
                    try {
                      return (
                        <SelectItem key={uniqueKey} value={optionStr}>
                          {optionStr}
                        </SelectItem>
                      )
                    } catch (error) {
                      console.error(`Error rendering SelectItem for ${key}:`, { option: optionStr, error })
                      return null
                    }
                  })
                  .filter(Boolean)
                }
              </SelectContent>
            </Select>
          </div>
        )
      }
      return null
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Explore All Entities</h2>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category to explore..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCategory && (
        <>
          {/* Search and Filter Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2 mb-4">
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Search entities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  disabled={Object.keys(availableFilters).length === 0}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Active Filters */}
              {Object.keys(currentFilters).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(currentFilters).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="flex items-center gap-1">
                      {key}: {typeof value === 'object' 
                        ? `${(value as any).min || 'any'} - ${(value as any).max || 'any'}`
                        : value}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeFilter(key)}
                      />
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-6"
                  >
                    Clear All
                  </Button>
                </div>
              )}

              {/* Filter Inputs */}
              {showFilters && Object.keys(availableFilters).length > 0 && (
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderFilterInputs()}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={applyFilters}>Apply Filters</Button>
                    <Button variant="outline" onClick={() => setShowFilters(false)}>
                      Hide Filters
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Results ({pagination.total} entities)
                </CardTitle>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : entities.length > 0 ? (
                <div className="space-y-4">
                  {entities.map((entity) => {
                    // Extract name from attributes or use a fallback
                    const entityName = entity.attributes?.name || entity.attributes?.title || `${entity.entity_type} #${entity.id.slice(-8)}`
                    const entityDescription = entity.attributes?.description || entity.attributes?.address || 'No description available'
                    const categoryDisplay = entity.mtcli_entity_categories?.display_name || entity.entity_type
                    const firstImage = entity.images?.find(img => img.url)?.url
                    
                    return (
                      <Card 
                        key={entity.id} 
                        className="p-4 cursor-pointer hover:shadow-md transition-shadow" 
                        onClick={() => {
                          setSelectedEntity(entity)
                          setIsModalOpen(true)
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{entityName}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {entityDescription}
                            </p>
                            
                            {/* Show some attributes if available */}
                            {entity.attributes && Object.keys(entity.attributes).length > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                {Object.entries(entity.attributes)
                                  .filter(([key, value]) => value && key !== 'name' && key !== 'description')
                                  .slice(0, 3)
                                  .map(([key, value]) => (
                                    <span key={key} className="mr-3">
                                      <strong>{key}:</strong> {value}
                                    </span>
                                  ))
                                }
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{categoryDisplay}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(entity.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                by {entity.owner_id}
                              </span>
                            </div>
                          </div>
                          
                          {/* Show first image if available */}
                          {firstImage && (
                            <div className="ml-4">
                              <img 
                                src={firstImage} 
                                alt={entityName}
                                className="w-16 h-16 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}

                  {/* Pagination */}
                  {(pagination.page > 1 || pagination.has_more) && (
                    <div className="flex items-center justify-between pt-4">
                      <Button
                        variant="outline"
                        disabled={pagination.page <= 1}
                        onClick={() => {
                          setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                          searchEntities()
                        }}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {pagination.page} ({pagination.total} total entities)
                      </span>
                      <Button
                        variant="outline"
                        disabled={!pagination.has_more}
                        onClick={() => {
                          setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                          searchEntities()
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedCategory ? 'No entities found for the selected criteria.' : 'Select a category to start exploring.'}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Entity Detail Modal */}
      <EntityDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entity={selectedEntity}
      />
    </div>
  )
}
