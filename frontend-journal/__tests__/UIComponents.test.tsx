import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

describe('shadcn/ui Core Components', () => {
  describe('Button', () => {
    it('renders with default variant and responds to click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies destructive and outline variant classes', () => {
      const { rerender } = render(<Button variant="destructive">Delete</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-destructive');

      rerender(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('border');
    });

    it('disables button when disabled prop is passed', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Badge', () => {
    it('renders badge with correct text and variant', () => {
      render(<Badge variant="secondary">Active Phase</Badge>);
      expect(screen.getByText('Active Phase')).toBeInTheDocument();
      expect(screen.getByText('Active Phase')).toHaveClass('bg-secondary');
    });
  });

  describe('Card', () => {
    it('renders card with all nested sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content area</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Main content area')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });
  });

  describe('Input and Label', () => {
    it('renders Input and Label together', () => {
      render(
        <div>
          <Label htmlFor="account-alias">Account Alias</Label>
          <Input id="account-alias" placeholder="Enter account alias" />
        </div>
      );

      expect(screen.getByLabelText('Account Alias')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter account alias')).toBeInTheDocument();
    });
  });

  describe('Separator', () => {
    it('renders horizontal separator', () => {
      const { container } = render(<Separator />);
      expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument();
    });
  });
});
