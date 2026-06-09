// NavLink component
/*
    Working:
    1. It is a custom component that wraps the default NavLink from react-router-dom
    2. It takes in the same props as the default NavLink
    3. It returns the default NavLink with the same props
*/
import { NavLink as RouterNavLink } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "../../utils/utils";

// Purpose: To provide a custom NavLink component that wraps the default NavLink from react-router-dom
const NavLink = forwardRef(({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
        <RouterNavLink 
            ref={ref} 
            to={to} 
            className={({ isActive, isPending }) => 
                cn(
                    className, 
                    isActive && activeClassName, 
                    isPending && pendingClassName
                )
            } 
            {...props} 
        />
    );
});

NavLink.displayName = "NavLink";

export { NavLink };