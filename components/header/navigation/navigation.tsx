'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;
}

export const navItemsData = [
  {
    href: '/locations',
    label: 'ლოკაციები',
    submenu: [
      { href: '/locations/all', label: 'ყველა ლოკაცია', description: 'პარაგლაიდინგის ლოკაციები საქართველოში' },
      { href: '/locations/popular', label: 'პოპულარული', description: 'ყველაზე პოპულარული ადგილები' },
      { href: '/locations/beginner', label: 'დამწყებთათვის', description: 'უსაფრთხო ადგილები სწავლისთვის' },
      { href: '/locations/advanced', label: 'გამოცდილებისთვის', description: 'რთული და ექსტრემალური ადგილები' },
    ],
  },
  {
    href: '/pilots',
    label: 'პილოტები',
    submenu: [
      { href: '/pilots/all', label: 'ყველა პილოტი', description: 'ნახეთ ყველა რეგისტრირებული პილოტი' },
      { href: '/pilots/top', label: 'ტოპ პილოტები', description: 'საუკეთესო პილოტების რეიტინგი' },
      { href: '/pilots/instructors', label: 'ინსტრუქტორები', description: 'გამოცდილი ინსტრუქტორები' },
      { href: '/pilots/become', label: 'გახდი პილოტი', description: 'დაიწყე შენი მოგზაურობა' },
    ],
  },
  {
    href: '/companies',
    label: 'კომპანიები',
    submenu: [
      { href: '/companies/all', label: 'ყველა კომპანია', description: 'პარაგლაიდინგ კომპანიები საქართველოში' },
      { href: '/companies/schools', label: 'სასწავლო ცენტრები', description: 'სერტიფიცირებული სასწავლო ცენტრები' },
      { href: '/companies/tour-operators', label: 'ტურ-ოპერატორები', description: 'ორგანიზებული ტურები' },
      { href: '/companies/equipment', label: 'აღჭურვილობა', description: 'აღჭურვილობის გაყიდვა და გაქირავება' },
    ],
  },
  {
    href: '/tours',
    label: 'ტურები',
    submenu: [
      { href: '/tours/all', label: 'ყველა ტური', description: 'ყველა ხელმისაწვდომი ტური' },
      { href: '/tours/weekend', label: 'შაბათ-კვირა', description: 'მოკლე ტურები უქმე დღეებში' },
      { href: '/tours/multi-day', label: 'მრავალდღიანი', description: 'მრავალდღიანი ექსპედიციები' },
      { href: '/tours/international', label: 'საზღვარგარეთ', description: 'საერთაშორისო ტურები' },
    ],
  },
  {
    href: '/education',
    label: 'სწავლება',
    submenu: [
      { href: '/education/courses', label: 'კურსები', description: 'პარაგლაიდინგის სასწავლო კურსები' },
      { href: '/education/beginners', label: 'დამწყებთათვის', description: 'საბაზო კურსი ნულიდან' },
      { href: '/education/advanced', label: 'გაუმჯობესება', description: 'უნარების გაუმჯობესება' },
      { href: '/education/safety', label: 'უსაფრთხოება', description: 'უსაფრთხოების წესები და ტექნიკა' },
    ],
  },
  {
    href: '/tests',
    label: 'ტესტები',
    submenu: [
      { href: '/tests/theory', label: 'თეორიული ტესტი', description: 'შეამოწმე თეორიული ცოდნა' },
      { href: '/tests/safety', label: 'უსაფრთხოების ტესტი', description: 'უსაფრთხოების წესების ტესტი' },
      { href: '/tests/weather', label: 'ამინდის ტესტი', description: 'ამინდის პირობების შეფასება' },
      { href: '/tests/practice', label: 'პრაქტიკული დავალებები', description: 'პრაქტიკული სავარჯიშოები' },
    ],
  },
];

export default function Navigation({ activeMenu, setActiveMenu }: NavigationProps) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ka';

  return (
    <nav className="hidden md:flex items-center gap-6">
      {navItemsData.map((item) => (
        <div
          key={item.href}
          className="relative"
          onMouseEnter={() => setActiveMenu(item.label)}
        >
          <Link
            href={`/${locale}${item.href}`}
            className="group flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground/70 transition-colors"
          >
            <span>{item.label}</span>
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${
                activeMenu === item.label ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Link>
        </div>
      ))}
    </nav>
  );
}
