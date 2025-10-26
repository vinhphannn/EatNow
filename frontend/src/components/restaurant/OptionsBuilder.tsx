"use client";
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stack,
  Typography,
  IconButton,
  Box,
  Card,
  Tooltip
} from "@mui/material";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

interface Choice {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
  isActive: boolean;
  position: number;
}

interface Option {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  choices: Choice[];
  position: number;
  isActive: boolean;
}

interface OptionsBuilderProps {
  open: boolean;
  onClose: () => void;
  option: Option;
  onSave: (option: Option) => void;
  onAddChoice: (optionId: string) => void;
  onUpdateChoice: (optionId: string, choiceId: string, updates: Partial<Choice>) => void;
  onRemoveChoice: (optionId: string, choiceId: string) => void;
}

export default function OptionsBuilder({
  open,
  onClose,
  option,
  onSave,
  onAddChoice,
  onUpdateChoice,
  onRemoveChoice
}: OptionsBuilderProps) {
  const [currentOption, setCurrentOption] = useState<Option>(option);

  const handleSave = () => {
    onSave(currentOption);
    onClose();
  };

  const handleAddChoice = () => {
    onAddChoice(currentOption.id);
    // Update local state to reflect the new choice
    const newChoice: Choice = {
      id: `choice_${Date.now()}`,
      name: '',
      price: 0,
      isDefault: false,
      isActive: true,
      position: currentOption.choices.length
    };
    setCurrentOption(prev => ({
      ...prev,
      choices: [...prev.choices, newChoice]
    }));
  };

  const handleUpdateChoice = (choiceId: string, updates: Partial<Choice>) => {
    onUpdateChoice(currentOption.id, choiceId, updates);
    setCurrentOption(prev => ({
      ...prev,
      choices: prev.choices.map(choice =>
        choice.id === choiceId ? { ...choice, ...updates } : choice
      )
    }));
  };

  const handleRemoveChoice = (choiceId: string) => {
    onRemoveChoice(currentOption.id, choiceId);
    setCurrentOption(prev => ({
      ...prev,
      choices: prev.choices.filter(choice => choice.id !== choiceId)
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Chỉnh sửa Option</Typography>
          <IconButton onClick={onClose}>
            <XMarkIcon width={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Option Basic Info */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Tên option"
              value={currentOption.name}
              onChange={(e) => setCurrentOption({ ...currentOption, name: e.target.value })}
              placeholder="Ví dụ: Size, Toppings, Spice Level"
              fullWidth
            />
            <Select
              value={currentOption.type}
              onChange={(e) => setCurrentOption({ ...currentOption, type: e.target.value as 'single' | 'multiple' })}
              fullWidth
            >
              <MenuItem value="single">Chọn 1</MenuItem>
              <MenuItem value="multiple">Chọn nhiều</MenuItem>
            </Select>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Nếu bật, khách hàng bắt buộc phải chọn ít nhất 1 lựa chọn trong option này">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentOption.required}
                    onChange={(e) => setCurrentOption({ ...currentOption, required: e.target.checked })}
                  />
                }
                label="Bắt buộc"
              />
            </Tooltip>
            <Tooltip title="Nếu bật, option này sẽ hiển thị cho khách hàng. Nếu tắt, option sẽ bị ẩn">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentOption.isActive}
                    onChange={(e) => setCurrentOption({ ...currentOption, isActive: e.target.checked })}
                  />
                }
                label="Kích hoạt"
              />
            </Tooltip>
          </Box>

          {/* Choices Management */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Lựa chọn</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddChoice}
                startIcon={<PlusIcon width={16} />}
              >
                Thêm lựa chọn
              </Button>
            </Box>

            {currentOption.choices && currentOption.choices.length > 0 ? (
              <Stack spacing={2}>
                {currentOption.choices.map((choice: Choice, index: number) => (
                  <Card key={choice.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">
                          Lựa chọn {index + 1}
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRemoveChoice(choice.id)}
                        >
                          Xóa
                        </Button>
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                        <TextField
                          label="Tên lựa chọn"
                          value={choice.name}
                          onChange={(e) => handleUpdateChoice(choice.id, { name: e.target.value })}
                          placeholder="Ví dụ: Size L, Thêm phô mai"
                          fullWidth
                        />
                        <TextField
                          label="Giá thêm (VNĐ)"
                          type="number"
                          value={choice.price}
                          onChange={(e) => handleUpdateChoice(choice.id, { price: Number(e.target.value) })}
                          placeholder="0"
                          fullWidth
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Tooltip title="Lựa chọn này sẽ được chọn sẵn và tính vào giá cuối cùng">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={choice.isDefault}
                                  onChange={(e) => {
                                    // Uncheck all other choices first
                                    currentOption.choices.forEach(ch => {
                                      if (ch.id !== choice.id) {
                                        handleUpdateChoice(ch.id, { isDefault: false });
                                      }
                                    });
                                    handleUpdateChoice(choice.id, { isDefault: e.target.checked });
                                  }}
                                />
                              }
                              label="Mặc định"
                            />
                          </Tooltip>
                        </Box>
                      </Box>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Chưa có lựa chọn nào. Nhấn "Thêm lựa chọn" để bắt đầu.
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{ textTransform: 'none' }}
        >
          Lưu Option
        </Button>
      </DialogActions>
    </Dialog>
  );
}
