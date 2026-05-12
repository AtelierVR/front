'use client';
import * as React from 'react';
import * as Primitive from '@radix-ui/react-navigation-menu';
import { cn } from '@/lib/utils';

const NavigationMenu = Primitive.Root;

const NavigationMenuList = Primitive.List;

const NavigationMenuItem = React.forwardRef<
  React.ComponentRef<typeof Primitive.Item>,
  React.ComponentPropsWithoutRef<typeof Primitive.Item>
>(({ className, children, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={cn('list-none flex items-center justify-center', className)}
    {...props}
  >
    {children}
  </Primitive.Item>
));
NavigationMenuItem.displayName = Primitive.Item.displayName;

const NavigationMenuTrigger = React.forwardRef<
  React.ComponentRef<typeof Primitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <Primitive.Trigger
    ref={ref}
    className={cn('data-[state=open]:bg-accent/50', className)}
    {...props}
  >
    {children}
  </Primitive.Trigger>
));
NavigationMenuTrigger.displayName = Primitive.Trigger.displayName;

const NavigationMenuContent = React.forwardRef<
  React.ComponentRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(({ className, ...props }, ref) => (
  <Primitive.Content
    ref={ref}
    className={cn(
      'absolute inset-x-0 top-0 overflow-auto max-h-[80svh]',
      'data-[motion=from-end]:[animation:var(--animate-nav-enter-right)]',
      'data-[motion=from-start]:[animation:var(--animate-nav-enter-left)]',
      'data-[motion=to-end]:[animation:var(--animate-nav-exit-right)]',
      'data-[motion=to-start]:[animation:var(--animate-nav-exit-left)]',
      className,
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = Primitive.Content.displayName;

const NavigationMenuLink = Primitive.Link;

const NavigationMenuViewport = React.forwardRef<
  React.ComponentRef<typeof Primitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof Primitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className="absolute inset-x-0 top-full z-50 w-full">
    <Primitive.Viewport
      ref={ref}
      {...props}
      className={cn(
        'relative h-[var(--radix-navigation-menu-viewport-height)] w-full origin-[top_center] overflow-hidden',
        'bg-background/95 backdrop-blur-lg shadow-md rounded-b-2xl',
        'transition-[width,height] duration-300',
        'data-[state=closed]:[animation:var(--animate-nav-menu-out)]',
        'data-[state=open]:[animation:var(--animate-nav-menu-in)]',
        className,
      )}
    />
  </div>
));
NavigationMenuViewport.displayName = Primitive.Viewport.displayName;

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuViewport,
};
